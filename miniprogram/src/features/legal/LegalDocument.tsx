import { Button, ScrollView, Text, View } from '@tarojs/components';
import { useState } from 'react';

import { LEGAL_CONTENT, type LegalDocumentType } from './legal-content';
import './LegalDocument.scss';

export function LegalDocument({
  initialDocument,
}: {
  initialDocument: LegalDocumentType;
}) {
  const [activeDocument, setActiveDocument] =
    useState<LegalDocumentType>(initialDocument);
  const document = LEGAL_CONTENT[activeDocument];

  return (
    <View className="legal-document">
      <View className="legal-document__tabs">
        <Button
          className={activeDocument === 'agreement' ? 'is-active' : ''}
          aria-label="用户协议"
          onClick={() => setActiveDocument('agreement')}
        >
          用户协议
        </Button>
        <Button
          className={activeDocument === 'privacy' ? 'is-active' : ''}
          aria-label="隐私政策"
          onClick={() => setActiveDocument('privacy')}
        >
          隐私政策
        </Button>
      </View>

      <ScrollView className="legal-document__scroll" scrollY>
        <View className="legal-document__paper">
          <Text className="legal-document__title">{document.title}</Text>
          <Text className="legal-document__subtitle">{document.subtitle}</Text>
          {document.sections.map((section, index) => (
            <View className="legal-document__section" key={section.title}>
              <Text className="legal-document__heading">
                {index + 1}. {section.title}
              </Text>
              {section.paragraphs.map((paragraph) => (
                <Text className="legal-document__paragraph" key={paragraph}>
                  {paragraph}
                </Text>
              ))}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
