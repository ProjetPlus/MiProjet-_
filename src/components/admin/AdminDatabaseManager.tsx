import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  Database, Download, Upload, RefreshCw, Clock, 
  CheckCircle, XCircle, HardDrive, Table as TableIcon,
  Settings, Play, Pause, FileJson, FileSpreadsheet, Code
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { fr } from "date-fns/locale";

interface TableInfo {
  name: string;
  rowCount: number;
  selected: boolean;
}

interface BackupRecord {
  id: string;
  backup_name: string;
  backup_type: string;
  tables_included: string[] | null;
  file_size: string | null;
  format: string;
  status: string;
  created_at: string;
  error_message: string | null;
}

const availableTables = [
  'profiles', 'projects', 'service_requests', 'invoices', 'payments',
  'notifications', 'news', 'faqs', 'categories', 'sectors',
  'contributions', 'messages', 'project_updates', 'access_requests',
  'user_documents', 'audit_logs'
];

export const AdminDatabaseManager = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [backups, setBackups] = useState<BackupRecord[]>([]);
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [selectedFormat, setSelectedFormat] = useState<'json' | 'csv'>('json');
  const [backupName, setBackupName] = useState("");
  const [exporting, setExporting] = useState(false);
  
  // Auto backup settings
  const [autoBackupEnabled, setAutoBackupEnabled] = useState(false);
  const [backupFrequency, setBackupFrequency] = useState('daily');

  useEffect(() => {
    initializeTables();
    fetchBackups();
  }, []);

  const initializeTables = async () => {
    const tableInfos: TableInfo[] = [];
    
    for (const tableName of availableTables) {
      try {
        const { count } = await supabase
          .from(tableName as any)
          .select('*', { count: 'exact', head: true });
        
        tableInfos.push({
          name: tableName,
          rowCount: count || 0,
          selected: false,
        });
      } catch {
        tableInfos.push({
          name: tableName,
          rowCount: 0,
          selected: false,
        });
      }
    }
    
    setTables(tableInfos);
  };

  const fetchBackups = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('database_backups')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    if (!error && data) {
      setBackups(data);
    }
    setLoading(false);
  };

  const toggleTable = (tableName: string) => {
    setTables(prev => prev.map(t => 
      t.name === tableName ? { ...t, selected: !t.selected } : t
    ));
  };

  const selectAllTables = () => {
    setTables(prev => prev.map(t => ({ ...t, selected: true })));
  };

  const deselectAllTables = () => {
    setTables(prev => prev.map(t => ({ ...t, selected: false })));
  };

  const exportData = async () => {
    const selectedTables = tables.filter(t => t.selected);
    
    if (selectedTables.length === 0) {
      toast({
        title: "Sélection requise",
        description: "Veuillez sélectionner au moins une table",
        variant: "destructive",
      });
      return;
    }

    setExporting(true);
    const exportData: Record<string, any[]> = {};

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      for (const table of selectedTables) {
        const { data, error } = await supabase
          .from(table.name as any)
          .select('*');
        
        if (!error && data) {
          exportData[table.name] = data;
        }
      }

      // Generate file
      let content: string;
      let mimeType: string;
      let extension: string;

      if (selectedFormat === 'json') {
        content = JSON.stringify(exportData, null, 2);
        mimeType = 'application/json';
        extension = 'json';
      } else {
        // CSV - combine all tables
        const allRows: string[] = [];
        for (const [tableName, rows] of Object.entries(exportData)) {
          if (rows.length > 0) {
            allRows.push(`# Table: ${tableName}`);
            const headers = Object.keys(rows[0]);
            allRows.push(headers.join(','));
            rows.forEach(row => {
              allRows.push(headers.map(h => JSON.stringify(row[h] ?? '')).join(','));
            });
            allRows.push('');
          }
        }
        content = allRows.join('\n');
        mimeType = 'text/csv';
        extension = 'csv';
      }

      // Download file
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `miprojet-backup-${format(new Date(), 'yyyy-MM-dd-HHmm')}.${extension}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // Record backup in database
      await supabase.from('database_backups').insert([{
        backup_name: backupName || `Backup ${format(new Date(), 'dd/MM/yyyy HH:mm')}`,
        backup_type: 'manual',
        tables_included: selectedTables.map(t => t.name),
        file_size: String(new Blob([content]).size),
        format: selectedFormat,
        status: 'completed',
        created_by: user?.id,
      }]);

      toast({
        title: "Export réussi",
        description: `${selectedTables.length} table(s) exportée(s) au format ${selectedFormat.toUpperCase()}`,
      });

      fetchBackups();
    } catch (error: any) {
      toast({
        title: "Erreur d'export",
        description: error.message,
        variant: "destructive",
      });

      // Record failed backup
      await supabase.from('database_backups').insert([{
        backup_name: backupName || `Backup ${format(new Date(), 'dd/MM/yyyy HH:mm')}`,
        backup_type: 'manual',
        tables_included: selectedTables.map(t => t.name),
        format: selectedFormat,
        status: 'failed',
        error_message: error.message,
      }]);
    } finally {
      setExporting(false);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const content = await file.text();
      const data = JSON.parse(content);

      toast({
        title: "Import en cours",
        description: "L'import des données est en cours...",
      });

      for (const [tableName, rows] of Object.entries(data)) {
        if (Array.isArray(rows) && rows.length > 0 && availableTables.includes(tableName)) {
          // Use upsert to handle existing records
          const { error } = await supabase
            .from(tableName as any)
            .upsert(rows as any[], { onConflict: 'id' });
          
          if (error) {
            console.error(`Error importing ${tableName}:`, error);
          }
        }
      }

      toast({
        title: "Import réussi",
        description: "Les données ont été importées avec succès",
      });

      initializeTables();
    } catch (error: any) {
      toast({
        title: "Erreur d'import",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'json':
        return <FileJson className="h-4 w-4" />;
      case 'csv':
        return <FileSpreadsheet className="h-4 w-4" />;
      default:
        return <Code className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-success/20 text-success"><CheckCircle className="h-3 w-3 mr-1" />Terminé</Badge>;
      case 'failed':
        return <Badge className="bg-destructive/20 text-destructive"><XCircle className="h-3 w-3 mr-1" />Échoué</Badge>;
      default:
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />En cours</Badge>;
    }
  };

  const formatFileSize = (bytes: string | number | null) => {
    if (!bytes) return '-';
    const numBytes = typeof bytes === 'string' ? parseInt(bytes, 10) : bytes;
    if (isNaN(numBytes)) return '-';
    if (numBytes < 1024) return `${numBytes} B`;
    if (numBytes < 1024 * 1024) return `${(numBytes / 1024).toFixed(1)} KB`;
    return `${(numBytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const totalRows = tables.reduce((sum, t) => sum + t.rowCount, 0);
  const selectedTablesCount = tables.filter(t => t.selected).length;

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Database className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{tables.length}</p>
                <p className="text-sm text-muted-foreground">Tables</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-info/10 rounded-lg">
                <TableIcon className="h-5 w-5 text-info" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalRows.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Enregistrements</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-success/10 rounded-lg">
                <HardDrive className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{backups.length}</p>
                <p className="text-sm text-muted-foreground">Sauvegardes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-warning/10 rounded-lg">
                <Clock className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {backups[0] ? format(new Date(backups[0].created_at), 'dd/MM') : '-'}
                </p>
                <p className="text-sm text-muted-foreground">Dernière sauvegarde</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="export" className="space-y-4">
        <TabsList>
          <TabsTrigger value="export">Exporter</TabsTrigger>
          <TabsTrigger value="import">Importer</TabsTrigger>
          <TabsTrigger value="history">Historique</TabsTrigger>
          <TabsTrigger value="settings">Paramètres</TabsTrigger>
        </TabsList>

        <TabsContent value="export">
          <Card>
            <CardHeader>
              <CardTitle>Exporter les données</CardTitle>
              <CardDescription>
                Sélectionnez les tables à exporter et le format de sortie
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={selectAllTables}>
                    Tout sélectionner
                  </Button>
                  <Button variant="outline" size="sm" onClick={deselectAllTables}>
                    Tout désélectionner
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  {selectedTablesCount} table(s) sélectionnée(s)
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {tables.map((table) => (
                  <div
                    key={table.name}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      table.selected ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                    }`}
                    onClick={() => toggleTable(table.name)}
                  >
                    <Checkbox checked={table.selected} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{table.name}</p>
                      <p className="text-xs text-muted-foreground">{table.rowCount} lignes</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="backup-name">Nom de la sauvegarde</Label>
                  <Input
                    id="backup-name"
                    value={backupName}
                    onChange={(e) => setBackupName(e.target.value)}
                    placeholder="Backup automatique"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Format</Label>
                  <Select value={selectedFormat} onValueChange={(v: 'json' | 'csv') => setSelectedFormat(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="json">JSON</SelectItem>
                      <SelectItem value="csv">CSV</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button 
                    className="w-full" 
                    onClick={exportData}
                    disabled={exporting || selectedTablesCount === 0}
                  >
                    {exporting ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Export en cours...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        Exporter
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="import">
          <Card>
            <CardHeader>
              <CardTitle>Importer des données</CardTitle>
              <CardDescription>
                Restaurez les données à partir d'un fichier de sauvegarde JSON
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border-2 border-dashed rounded-lg p-8 text-center">
                <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">
                  Glissez un fichier JSON de sauvegarde ou cliquez pour sélectionner
                </p>
                <input
                  type="file"
                  accept=".json"
                  className="hidden"
                  id="import-file"
                  onChange={handleImport}
                />
                <Button variant="outline" onClick={() => document.getElementById('import-file')?.click()}>
                  Sélectionner un fichier
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Historique des sauvegardes</CardTitle>
                  <CardDescription>Les 20 dernières sauvegardes</CardDescription>
                </div>
                <Button variant="outline" onClick={fetchBackups}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Actualiser
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary" />
                </div>
              ) : backups.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Aucune sauvegarde enregistrée
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nom</TableHead>
                      <TableHead>Format</TableHead>
                      <TableHead>Tables</TableHead>
                      <TableHead>Taille</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {backups.map((backup) => (
                      <TableRow key={backup.id}>
                        <TableCell className="font-medium">{backup.backup_name}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {getFormatIcon(backup.format)}
                            <span className="uppercase text-xs">{backup.format}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {backup.tables_included?.length || 0} table(s)
                        </TableCell>
                        <TableCell>{formatFileSize(backup.file_size)}</TableCell>
                        <TableCell>{getStatusBadge(backup.status)}</TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {formatDistanceToNow(new Date(backup.created_at), {
                              addSuffix: true,
                              locale: fr,
                            })}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Paramètres de sauvegarde automatique</CardTitle>
              <CardDescription>
                Configurez les sauvegardes automatiques périodiques
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  {autoBackupEnabled ? (
                    <Play className="h-5 w-5 text-success" />
                  ) : (
                    <Pause className="h-5 w-5 text-muted-foreground" />
                  )}
                  <div>
                    <p className="font-medium">Sauvegarde automatique</p>
                    <p className="text-sm text-muted-foreground">
                      {autoBackupEnabled ? 'Activée' : 'Désactivée'}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={autoBackupEnabled}
                  onCheckedChange={setAutoBackupEnabled}
                />
              </div>

              {autoBackupEnabled && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Fréquence</Label>
                    <Select value={backupFrequency} onValueChange={setBackupFrequency}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hourly">Toutes les heures</SelectItem>
                        <SelectItem value="daily">Quotidien</SelectItem>
                        <SelectItem value="weekly">Hebdomadaire</SelectItem>
                        <SelectItem value="monthly">Mensuel</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="p-4 bg-warning/10 border border-warning/20 rounded-lg">
                    <p className="text-sm text-warning-foreground">
                      <strong>Note:</strong> La sauvegarde automatique vers un stockage externe (Google Drive, OVH) 
                      nécessite une configuration supplémentaire via les paramètres du backend.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
