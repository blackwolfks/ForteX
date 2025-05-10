
import { Download, Edit, Eye, EyeOff, Trash2, FileArchive } from "lucide-react";
import { TableRow, TableCell } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { FileItem } from "./types";
import { Badge } from "@/components/ui/badge";

interface FileAccessItemProps {
  file: FileItem;
  index: number;
  formatFileSize: (size: number) => string;
  toggleFileVisibility: (index: number) => void;
  onDownload: (file: FileItem) => void;
  onEdit: (file: FileItem) => void;
  onDelete: (file: FileItem) => void;
}

const FileAccessItem = ({ 
  file, 
  index, 
  formatFileSize, 
  toggleFileVisibility,
  onDownload,
  onEdit,
  onDelete
}: FileAccessItemProps) => {
  // Use is_public with isPublic as fallback for backwards compatibility
  const isPublic = file.is_public ?? file.isPublic ?? false;
  const isZipFile = file.name.toLowerCase().endsWith('.zip');
  
  return (
    <TableRow>
      <TableCell>
        <div className="font-medium flex items-center">
          {isZipFile ? (
            <FileArchive className="h-4 w-4 mr-2 text-blue-500" />
          ) : null}
          <span>{file.name}</span>
          {isZipFile && (
            <Badge variant="outline" className="ml-2">Downloadbar</Badge>
          )}
        </div>
      </TableCell>
      <TableCell>{formatFileSize(file.size || 0)}</TableCell>
      <TableCell>
        <div className="flex items-center space-x-3">
          <Switch
            checked={isPublic}
            onCheckedChange={() => toggleFileVisibility(index)}
            id={`file-visibility-${index}`}
          />
          <Label htmlFor={`file-visibility-${index}`} className="flex items-center">
            {isPublic ? (
              <>
                <Eye className="mr-2 h-4 w-4 text-green-500" />
                <span>Öffentlich</span>
              </>
            ) : (
              <>
                <EyeOff className="mr-2 h-4 w-4 text-red-500" />
                <span>Privat</span>
              </>
            )}
          </Label>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center space-x-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => onDownload(file)}
          >
            <Download className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => onEdit(file)}
            disabled={isZipFile}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-destructive hover:text-destructive" 
            onClick={() => onDelete(file)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
};

export default FileAccessItem;
