
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import FileAccessItem from "./FileAccessItem";
import { FileItem } from "./types";

interface FileAccessListProps {
  files: FileItem[];
  formatFileSize: (size: number) => string;
  toggleFileVisibility: (index: number) => void;
  onDownloadFile: (file: FileItem) => void;
  onEditFile: (file: FileItem) => void;
  onDeleteFile: (file: FileItem) => void;
}

const FileAccessList = ({ 
  files, 
  formatFileSize, 
  toggleFileVisibility,
  onDownloadFile,
  onEditFile,
  onDeleteFile
}: FileAccessListProps) => {
  if (files.length === 0) {
    return <div className="text-center py-4">Keine Dateien vorhanden</div>;
  }

  // Sortiere die Dateien so, dass ZIP-Dateien zuerst angezeigt werden
  const sortedFiles = [...files].sort((a, b) => {
    const aIsZip = a.name.toLowerCase().endsWith('.zip');
    const bIsZip = b.name.toLowerCase().endsWith('.zip');
    
    if (aIsZip && !bIsZip) return -1;
    if (!aIsZip && bIsZip) return 1;
    return a.name.localeCompare(b.name);
  });

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Dateiname</TableHead>
          <TableHead>Größe</TableHead>
          <TableHead>Öffentlich sichtbar</TableHead>
          <TableHead>Aktionen</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sortedFiles.map((file, index) => (
          <FileAccessItem
            key={file.id || `${file.name}-${index}`}
            file={file}
            index={index}
            formatFileSize={formatFileSize}
            toggleFileVisibility={toggleFileVisibility}
            onDownload={onDownloadFile}
            onEdit={onEditFile}
            onDelete={onDeleteFile}
          />
        ))}
      </TableBody>
    </Table>
  );
};

export default FileAccessList;
