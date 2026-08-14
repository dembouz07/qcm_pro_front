import { useParams } from 'react-router-dom';
import AssessmentBuilderPage from '../features/assessmentBuilder/AssessmentBuilderPage.jsx';

export default function ProgressiveQuizForm() {
  const { id } = useParams();
  return <AssessmentBuilderPage type="progressive" mode={id ? 'edit' : 'create'} source={id ? 'edit' : 'manual'} />;
}
