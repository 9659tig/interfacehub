import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormEvent, useState } from 'react';

interface NLSearchBarProps {
  onSearch: (question: string) => void;
  loading: boolean;
}

export function NLSearchBar({ onSearch, loading }: NLSearchBarProps) {
  const [question, setQuestion] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (question.trim()) {
      onSearch(question.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <Input
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        placeholder="자연어로 로그를 검색하세요 (예: '어제 오후 실패한 MQ 건 보여줘')"
        className="flex-1"
        disabled={loading}
      />
      <Button type="submit" disabled={loading || !question.trim()}>
        {loading ? '분석 중...' : 'AI 검색'}
      </Button>
    </form>
  );
}
