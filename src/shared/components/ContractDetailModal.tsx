import React from 'react';

interface ContractDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  contract?: any;
}

const ContractDetailModal: React.FC<ContractDetailModalProps> = ({
  isOpen,
  onClose,
  contract
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-auto bg-smoke-light flex">
      <div className="relative p-8 bg-white w-full max-w-md m-auto flex-col flex rounded-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">契約詳細</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ×
          </button>
        </div>
        
        <div className="flex-1">
          {contract ? (
            <div className="space-y-4">
              <p>案件No: {contract.contract_number}</p>
              <p>患者名: {contract.patient_name}</p>
              <p>治療名: {contract.treatment_name}</p>
              <p>金額: ¥{contract.contract_amount?.toLocaleString()}</p>
              <p>ステータス: {contract.status}</p>
            </div>
          ) : (
            <p>契約情報が見つかりません。</p>
          )}
        </div>
        
        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
};

export { ContractDetailModal };