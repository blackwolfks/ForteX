
import { Download, Edit, Eye, EyeOff, Trash2 } from "lucide-react";
import { TableRow, TableCell } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { FileItem } from "./types";

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
  const isZipFile = file.name.toLowerCase().endsWith('.zip');
  const fileExtension = file.name.split('.').pop()?.toLowerCase();
  
  return (
    <TableRow>
      <TableCell>
        <div className="space-y-1">
          <div className="font-medium">{file.name}</div>
          {file.description && (
            <div className="text-xs text-muted-foreground line-clamp-2">
              {file.description}
            </div>
          )}
        </div>
      </TableCell>
      <TableCell>{formatFileSize(file.size || 0)}</TableCell>
      <TableCell>
        <div className="flex items-center space-x-3">
          {isZipFile ? (
            <div className="flex items-center">
              <Eye className="mr-2 h-4 w-4 text-green-500" />
              <span>Immer öffentlich</span>
            </div>
          ) : (
            <Switch
              checked={file.isPublic}
              onCheckedChange={() => toggleFileVisibility(index)}
              id={`file-visibility-${index}`}
              disabled={isZipFile}
            />
          )}
          {!isZipFile && (
            <Label htmlFor={`file-visibility-${index}`} className="flex items-center">
              {file.isPublic ? (
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
          )}
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
