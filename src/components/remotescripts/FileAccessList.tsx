
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import FileAccessItem from "./FileAccessItem";
import { FileItem } from "./hooks/useFileAccess";

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
        {files.map((file, index) => (
          <FileAccessItem
            key={file.fullPath}
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
