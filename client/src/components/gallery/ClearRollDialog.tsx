import { RiDeleteBinLine } from "@remixicon/react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface ClearRollDialogProps {
  printCount: number;
  onConfirm: () => void;
}

export function ClearRollDialog({ printCount, onConfirm }: ClearRollDialogProps) {
  return (
    <AlertDialog>
      <AlertDialogTrigger>
        <Button
          type="button"
          variant="destructive"
          size="icon-lg"
          className="shadow-sm"
          aria-label="Clear all prints"
        >
          <RiDeleteBinLine className="size-5" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Clear all prints?</AlertDialogTitle>
          <AlertDialogDescription>
            This removes all {printCount} print{printCount === 1 ? "" : "s"} from this
            device. You cannot undo this action.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={onConfirm}>
            Clear all
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
