import { Link } from 'react-router-dom';
import { QuotationSummary } from './QuotationSummary.jsx';

export function AgencyQuotationDetail({ quotation, onSubmit, onWithdraw }) {
  if (!quotation) return <p>No quotation found.</p>;
  const status = quotation.status;
  return (
    <div>
      <QuotationSummary quotation={quotation} />
      {status === 'draft' && (
        <p>
          <Link to={`/quotations/${quotation.id}/edit`}>Edit quotation</Link>
        </p>
      )}
      {status === 'draft' && (
        <button type="button" onClick={() => onSubmit?.(quotation.id)}>
          Submit quotation
        </button>
      )}
      {(status === 'draft' || status === 'submitted') && (
        <button type="button" onClick={() => onWithdraw?.(quotation.id)}>
          Withdraw quotation
        </button>
      )}
    </div>
  );
}
