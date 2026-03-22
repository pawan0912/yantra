import { Button } from "../../../components/ui";

type ActionBarProps = {
  showHistory: boolean;
  hasContent: boolean;
  onNew: () => void;
  onClear: () => void;
  onToggleHistory: () => void;
  onImportCurl: () => void;
  onExportCurl: () => void;
};

export function ActionBar({
  showHistory, hasContent, onNew, onClear, onToggleHistory, onImportCurl, onExportCurl,
}: ActionBarProps): React.ReactElement {
  return (
    <div className="flex items-center gap-1.5 px-3 py-2 border-b border-gray-200/60 dark:border-white/[0.06]">
      <Button variant="secondary" onClick={onNew}>
        New
      </Button>
      <Button variant="secondary" onClick={onClear} disabled={!hasContent}>
        Clear
      </Button>
      <Button variant="secondary" active={showHistory} onClick={onToggleHistory}>
        History
      </Button>
      <Button variant="secondary" onClick={onImportCurl}>
        cURL Import
      </Button>
      <Button variant="secondary" onClick={onExportCurl} disabled={!hasContent}>
        Copy as cURL
      </Button>
    </div>
  );
}
