'use client';
import { Modal } from '@carbon/react';

interface Props {
  open: boolean;
  count: number;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function DeleteConfirmModal({ open, count, onCancel, onConfirm }: Props) {
  return (
    <Modal
      danger
      open={open}
      modalHeading={count === 1 ? 'Delete transaction?' : `Delete ${count} transactions?`}
      primaryButtonText="Delete"
      secondaryButtonText="Cancel"
      onRequestClose={onCancel}
      onRequestSubmit={onConfirm}
    >
      <p className="cds--type-body-01">This can&rsquo;t be undone.</p>
    </Modal>
  );
}
