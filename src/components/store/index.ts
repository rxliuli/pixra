import { makeAutoObservable } from 'mobx'

class AppToolbarStore {
  constructor() {
    makeAutoObservable(this)
  }
}

const toolbarStore = new AppToolbarStore()

class SceneStore {
  imageData: ImageBitmap | null = null

  constructor() {
    makeAutoObservable(this)
  }

  setImageData(imageData: ImageBitmap | null) {
    this.imageData = imageData
  }
}

const sceneStore = new SceneStore()

class AppStateStore {
  readonly toolbarStore = new AppToolbarStore()
  readonly sceneStore = new SceneStore()
  constructor() {
    makeAutoObservable(this)
  }
}

export const appStateStore = new AppStateStore()
