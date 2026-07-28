import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { WebShell } from './WebShell';
import { WebPage } from './WebPage';

interface WebLegalLayoutProps {
  title: string;
  children: React.ReactNode;
}

export function WebLegalLayout({ title, children }: WebLegalLayoutProps) {
  return (
    <WebShell>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <WebPage title={title} narrow>
          {children}
        </WebPage>
      </ScrollView>
    </WebShell>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, width: '100%' },
  content: { paddingBottom: 48 },
});
