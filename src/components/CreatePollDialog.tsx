import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import Icon from '@/components/ui/icon';

interface CreatePollDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (title: string, description: string, options: string[]) => void;
}

export default function CreatePollDialog({ isOpen, onOpenChange, onCreate }: CreatePollDialogProps) {
  const [newPollTitle, setNewPollTitle] = useState('');
  const [newPollDescription, setNewPollDescription] = useState('');
  const [newPollOptions, setNewPollOptions] = useState(['', '']);

  const handleCreate = () => {
    if (newPollTitle && newPollOptions.filter(opt => opt.trim()).length >= 2) {
      onCreate(newPollTitle, newPollDescription, newPollOptions.filter(opt => opt.trim()));
      setNewPollTitle('');
      setNewPollDescription('');
      setNewPollOptions(['', '']);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Icon name="Plus" size={16} />
          Создать голосование
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Новое голосование</DialogTitle>
          <DialogDescription>
            Создайте новое голосование для участников платформы
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Название голосования</Label>
            <Input
              value={newPollTitle}
              onChange={(e) => setNewPollTitle(e.target.value)}
              placeholder="Введите название"
            />
          </div>
          <div className="space-y-2">
            <Label>Описание</Label>
            <Textarea
              value={newPollDescription}
              onChange={(e) => setNewPollDescription(e.target.value)}
              placeholder="Опишите цель голосования"
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label>Варианты ответов</Label>
            {newPollOptions.map((option, idx) => (
              <Input
                key={idx}
                value={option}
                onChange={(e) => {
                  const updated = [...newPollOptions];
                  updated[idx] = e.target.value;
                  setNewPollOptions(updated);
                }}
                placeholder={`Вариант ${idx + 1}`}
              />
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setNewPollOptions([...newPollOptions, ''])}
              className="gap-2"
            >
              <Icon name="Plus" size={14} />
              Добавить вариант
            </Button>
          </div>
          <Button onClick={handleCreate} className="w-full">
            Создать голосование
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
