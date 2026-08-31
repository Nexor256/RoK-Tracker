import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'
import '@fontsource-variable/outfit'
import '@fontsource-variable/jetbrains-mono'
import '@fontsource-variable/space-grotesk'
import './assets/main.css'
import './assets/themes.css'

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.mount('#app')
