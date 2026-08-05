import Taro from '@tarojs/taro';

import { LegalDocument } from '../../features/legal/LegalDocument';
import type { LegalDocumentType } from '../../features/legal/legal-content';

export default function LegalPage() {
  const document = Taro.getCurrentInstance().router?.params.document;
  const initialDocument: LegalDocumentType =
    document === 'privacy' ? 'privacy' : 'agreement';

  return <LegalDocument initialDocument={initialDocument} />;
}
