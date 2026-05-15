import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Search, Eye, Shield, UserX, Mail, Plus, Loader2, UserPlus, Users, Phone, UserCheck } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface UserProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  user_type: string | null;
  is_verified: boolean | null;
  account_status: string | null;
  created_at: string;
  role?: string;
}

export const AdminUsersTable = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();
  
  const [newUser, setNewUser] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    phone: "",
    role: "user" as "admin" | "moderator" | "user",
  });

  const fetchUsers = async () => {
    try {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const usersWithRoles = await Promise.all(
        (profiles || []).map(async (profile) => {
          const { data: roles } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', profile.id)
            .single();
          
          return {
            ...profile,
            role: roles?.role || 'user',
          };
        })
      );

      setUsers(usersWithRoles);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newUser.email || !newUser.password) {
      toast({ title: "Erreur", description: "Email et mot de passe requis", variant: "destructive" });
      return;
    }

    if (newUser.password.length < 6) {
      toast({ title: "Erreur", description: "Le mot de passe doit contenir au moins 6 caractères", variant: "destructive" });
      return;
    }

    setIsCreating(true);

    try {
      // Call the create-admin edge function to create user with proper privileges
      const { data, error } = await supabase.functions.invoke('create-admin', {
        body: {
          email: newUser.email,
          password: newUser.password,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          phone: newUser.phone,
        }
      });

      if (error) throw error;

      if (data?.success === false) {
        toast({ 
          title: "Erreur", 
          description: data.message || "Impossible de créer l'utilisateur", 
          variant: "destructive" 
        });
        return;
      }

      // If role is not admin, update it
      if (data?.userId && newUser.role !== 'admin') {
        await supabase
          .from('user_roles')
          .update({ role: newUser.role })
          .eq('user_id', data.userId);
      }

      toast({ 
        title: "Succès", 
        description: `Utilisateur ${newUser.firstName} ${newUser.lastName} créé avec succès` 
      });
      
      setNewUser({
        email: "",
        password: "",
        firstName: "",
        lastName: "",
        phone: "",
        role: "user",
      });
      setIsDialogOpen(false);
      fetchUsers();

    } catch (error: any) {
      console.error('Error creating user:', error);
      toast({ 
        title: "Erreur", 
        description: error.message || "Impossible de créer l'utilisateur", 
        variant: "destructive" 
      });
    } finally {
      setIsCreating(false);
    }
  };

  const assignRole = async (userId: string, role: 'admin' | 'moderator' | 'user') => {
    try {
      const { data: existingRole } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (existingRole) {
        const { error } = await supabase
          .from('user_roles')
          .update({ role })
          .eq('user_id', userId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_roles')
          .insert({ user_id: userId, role });
        if (error) throw error;
      }

      toast({ title: "Succès", description: `Rôle ${role} attribué` });
      fetchUsers();
    } catch (error: any) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    }
  };

  const setAccountStatus = async (userId: string, status: 'active' | 'suspended', reason?: string) => {
    try {
      const updates: any = {
        account_status: status,
        suspended_at: status === 'suspended' ? new Date().toISOString() : null,
        suspended_reason: status === 'suspended' ? (reason || 'Suspension administrative') : null,
      };
      const { error } = await supabase.from('profiles').update(updates).eq('id', userId);
      if (error) throw error;
      toast({ title: status === 'active' ? 'Compte activé' : 'Compte suspendu' });
      fetchUsers();
    } catch (e: any) {
      toast({ title: 'Erreur', description: e.message, variant: 'destructive' });
    }
  };

  const getRoleBadge = (role: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", className: string }> = {
      admin: { variant: "destructive", className: "bg-destructive" },
      moderator: { variant: "default", className: "bg-warning text-warning-foreground" },
      user: { variant: "secondary", className: "" },
    };
    const config = variants[role] || variants.user;
    return <Badge variant={config.variant} className={config.className}>{role}</Badge>;
  };

  const getInitials = (firstName: string | null, lastName: string | null) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase() || '?';
  };

  const filteredUsers = users.filter(u =>
    u.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.last_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-muted rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Users className="h-8 w-8" />
            Gestion des Utilisateurs
          </h1>
          <p className="text-muted-foreground">Gérez les comptes et les rôles utilisateurs</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="h-4 w-4 mr-2" />
              Ajouter un utilisateur
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-primary" />
                Nouvel utilisateur
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Prénom *</Label>
                  <Input
                    id="firstName"
                    value={newUser.firstName}
                    onChange={(e) => setNewUser({ ...newUser, firstName: e.target.value })}
                    placeholder="Jean"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Nom *</Label>
                  <Input
                    id="lastName"
                    value={newUser.lastName}
                    onChange={(e) => setNewUser({ ...newUser, lastName: e.target.value })}
                    placeholder="Dupont"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  placeholder="jean.dupont@example.com"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe *</Label>
                <Input
                  id="password"
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  placeholder="Minimum 6 caractères"
                  required
                  minLength={6}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">Téléphone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={newUser.phone}
                  onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                  placeholder="+225 07 07 07 07 07"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="role">Rôle</Label>
                <Select
                  value={newUser.role}
                  onValueChange={(value: "admin" | "moderator" | "user") => setNewUser({ ...newUser, role: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">Utilisateur</SelectItem>
                    <SelectItem value="moderator">Modérateur</SelectItem>
                    <SelectItem value="admin">Administrateur</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Annuler
                </Button>
                <Button type="submit" disabled={isCreating}>
                  {isCreating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Création...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Créer
                    </>
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Liste des Utilisateurs ({users.length})</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Utilisateur</TableHead>
                <TableHead>Téléphone</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Rôle</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Inscription</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {getInitials(user.first_name, user.last_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">
                          {user.first_name || ''} {user.last_name || ''}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          ID: {user.id.substring(0, 8)}...
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{user.phone || '-'}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {user.user_type || 'individual'}
                    </Badge>
                  </TableCell>
                  <TableCell>{getRoleBadge(user.role || 'user')}</TableCell>
                  <TableCell>
                    {user.account_status === 'suspended' ? (
                      <Badge variant="destructive">Suspendu</Badge>
                    ) : user.is_verified ? (
                      <Badge className="bg-success text-success-foreground">Vérifié</Badge>
                    ) : (
                      <Badge variant="outline">Actif</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {new Date(user.created_at).toLocaleDateString('fr-FR')}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Eye className="mr-2 h-4 w-4" /> Voir profil
                        </DropdownMenuItem>
                        {user.email && (
                          <DropdownMenuItem asChild>
                            <a href={`mailto:${user.email}`}>
                              <Mail className="mr-2 h-4 w-4" /> Contacter par email
                            </a>
                          </DropdownMenuItem>
                        )}
                        {user.phone && (
                          <DropdownMenuItem asChild>
                            <a href={`https://wa.me/${user.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer">
                              <Phone className="mr-2 h-4 w-4" /> Contacter WhatsApp
                            </a>
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => assignRole(user.id, 'admin')}>
                          <Shield className="mr-2 h-4 w-4" /> Définir Admin
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => assignRole(user.id, 'moderator')}>
                          <Shield className="mr-2 h-4 w-4" /> Définir Modérateur
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => assignRole(user.id, 'user')}>
                          <Shield className="mr-2 h-4 w-4" /> Définir User
                        </DropdownMenuItem>
                        {user.account_status === 'suspended' ? (
                          <DropdownMenuItem onClick={() => setAccountStatus(user.id, 'active')} className="text-success">
                            <UserCheck className="mr-2 h-4 w-4" /> Activer le compte
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onClick={() => setAccountStatus(user.id, 'suspended')} className="text-destructive">
                            <UserX className="mr-2 h-4 w-4" /> Suspendre
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {filteredUsers.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Aucun utilisateur trouvé
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
