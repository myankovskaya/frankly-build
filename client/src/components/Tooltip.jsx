const DEFINITIONS = {
  'burn rate': 'How fast you\'re spending cash each month.',
  'runway': 'How many months until you run out of cash at current spending.',
  'confidence score': 'How reliable your financial data is, based on completeness and consistency.',
  'gross margin': 'Revenue minus the direct cost of delivering your product or service.',
  'variance': 'The difference between what you expected and what actually happened.',
  'MTD': 'Month to date — everything that\'s happened so far this month.',
  'accounts receivable': 'Money customers owe you but haven\'t paid yet.',
  'accounts payable': 'Money you owe suppliers but haven\'t paid yet.',
  'waterfall chart': 'A chart showing how cash moved from one balance to another.',
  'MoM': 'Month over month — comparing this month to last month.',
};

export default function Tooltip({ term, children }) {
  const definition = DEFINITIONS[term];
  return (
    <span className="tooltip-wrap">
      <span className="tooltip-trigger">{children || term}</span>
      {definition && (
        <span className="tooltip-bubble" role="tooltip">{definition}</span>
      )}
    </span>
  );
}
