/**
 * Application entry point
 */

import './style.css';
import './components/glowcard.css';
import { AppInitializer } from './init/AppInitializer';

// Initialize the application
const app = new AppInitializer();
void app.init().catch((error) => {
  console.error('Failed to initialize application:', error);
});
