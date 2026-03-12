import {
  createRouter,
  createWebHashHistory,
} from 'vue-router'
import routes from './routes'

const router = createRouter({
  scrollBehavior: () => ({ left: 0, top: 0 }),
  routes,
  history: createWebHashHistory(),
})

router.beforeEach((to, from) => {
  const toTopLevel = to.path.split('/')[1]
  const fromTopLevel = from.path.split('/')[1]

  if (fromTopLevel !== undefined && toTopLevel !== undefined) {
    if (fromTopLevel === 'scanner') {
      to.meta.transitionIn = 'slide-up'
      to.meta.transitionOut = 'slide-up'
    } else if (fromTopLevel === 'settings') {
      to.meta.transitionIn = 'slide-down'
      to.meta.transitionOut = 'slide-down'
    } else if (fromTopLevel === 'calculator') {
      if (toTopLevel === 'scanner') {
        to.meta.transitionIn = 'slide-down'
        to.meta.transitionOut = 'slide-down'
      } else if (toTopLevel === 'settings') {
        to.meta.transitionIn = 'slide-up'
        to.meta.transitionOut = 'slide-up'
      }
    }
  }
})

export default router
