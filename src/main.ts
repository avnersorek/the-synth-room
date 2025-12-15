/**
 * Application entry point
 */

import './style.css';
import './components/glowcard.css';
import { AppInitializer } from './init/AppInitializer';

// Initialize the application
const app = new AppInitializer();
app.init();
