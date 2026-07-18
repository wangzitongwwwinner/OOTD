import type { PropsWithChildren } from 'react';
import { useEffect } from 'react';
import Taro from '@tarojs/taro';

import './app.scss';

function App({ children }: PropsWithChildren) {
  useEffect(() => {
    Taro.cloud.init({
      env: 'ootd-ai-dev-d6g5hzex6925fcea7',
      traceUser: true,
    });
  }, []);

  return children;
}

export default App;
