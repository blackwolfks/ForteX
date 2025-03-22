
import { Eye, EyeOff } from "lucide-react";
import { TableRow, TableCell } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { FileItem } from "./hooks/useFileAccess";

interface FileAccessItemProps {
  file: FileItem;
  index: number;
  formatFileSize: (size: number) => string;
  toggleFileVisibility: (index: number) => void;
}

const FileAccessItem = ({ 
  file, 
  index, 
  formatFileSize, 
  toggleFileVisibility 
}: FileAccessItemProps) => {
  return (
    <TableRow>
      <TableCell>
        <div className="font-medium">{file.name}</div>
      </TableCell>
      <TableCell>{formatFileSize(file.size)}</TableCell>
      <TableCell>
        <div className="flex items-center space-x-3">
          <Switch
            checked={file.isPublic}
            onCheckedChange={() => toggleFileVisibility(index)}
            id={`file-visibility-${index}`}
          />
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
        </div>
      </TableCell>
    </TableRow>
  );
};

export default FileAccessItem;
