/**
 * Hello World Plugin for Pixra
 *
 * This is a simple example plugin that demonstrates:
 * - Plugin activation
 * - Command registration
 * - API usage
 */

import * as pixra from '@pixra/plugin-sdk'

/**
 * This function is called when the plugin is activated
 */
export function activate(context: pixra.ExtensionContext) {
  // Register a command
  const disposable = pixra.commands.registerCommand(
    'helloWorld.sayHello',
    async () => {
      const greeting = await pixra.configuration.get<string>(
        'hello-world.greeting',
      )
      // Show a message to the user
      await pixra.window.showInformationMessage(greeting!)
    },
  )

  // Add to subscriptions for cleanup
  context.subscriptions.push(disposable)
}

/**
 * This function is called when the plugin is deactivated
 */
export function deactivate() {
  console.log('Hello World plugin is now deactivated')
}
