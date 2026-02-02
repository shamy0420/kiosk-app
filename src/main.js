import { createApp } from 'vue';
import { Quasar } from 'quasar';
import App from './App.vue';
import './styles.css';
import 'quasar/dist/quasar.css';

createApp(App).use(Quasar, { plugins: {} }).mount('#app');
