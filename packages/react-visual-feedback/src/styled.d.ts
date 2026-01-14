/**
 * Styled-components type augmentation
 *
 * This file extends the DefaultTheme type from styled-components
 * to include our custom theme properties. This ensures type safety
 * when accessing theme values in styled components.
 */
import 'styled-components';
import type { Theme } from './types/index';

declare module 'styled-components' {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  export interface DefaultTheme extends Theme { }
}
