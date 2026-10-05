import { QuotationBuilder } from './QuotationBuilder.jsx';

export function QuotationForm({ initial, onSubmit, submitLabel = 'Save draft', travelRequest = null }) {
  return (
    <QuotationBuilder
      initial={initial}
      travelRequest={travelRequest}
      onSubmit={onSubmit}
      onSaveDraft={onSubmit}
      submitLabel={submitLabel}
    />
  );
}
