import { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Edit2, Save, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface EditableSectionProps {
  title: string;
  content: string;
  isEdited?: boolean;
  onSave: (content: string) => void;
  placeholder?: string;
  className?: string;
}

export const EditableSection = ({
  title,
  content,
  isEdited = false,
  onSave,
  placeholder,
  className = ''
}: EditableSectionProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(content);

  const handleSave = () => {
    onSave(editedContent);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedContent(content);
    setIsEditing(false);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-xl font-semibold">{title}</h3>
          {isEdited && (
            <Badge variant="secondary" className="text-xs">
              Edited
            </Badge>
          )}
        </div>
        {!isEditing ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(true)}
          >
            <Edit2 className="h-4 w-4 mr-2" />
            Edit
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button
              variant="default"
              size="sm"
              onClick={handleSave}
            >
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancel}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          </div>
        )}
      </div>

      {isEditing ? (
        <Textarea
          value={editedContent}
          onChange={(e) => setEditedContent(e.target.value)}
          placeholder={placeholder}
          rows={10}
          className="font-mono text-sm"
        />
      ) : (
        <div className="prose prose-sm max-w-none">
          <p className="text-foreground/80 whitespace-pre-wrap leading-relaxed">
            {content || placeholder}
          </p>
        </div>
      )}
    </div>
  );
};
