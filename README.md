

# ngx-event-handler

This directive can be used to handle events, by default click events, that matches given critera.
For example: handle or span click, handle all clicks where element has class '.custom-button',
handle all clicks where id is not 'toolbar' and also class is not .selection.

The matching occurs by checking the target element and it's parents.
This makes it easy to define: don't trigger my 'clickoutside' event when clicking the div with id: 'toolbar' and also don't trigger when any of the child elements of the toolbar is clicked.

See the demo project for examples:
- click outside
- bind multiple event at once
- bind events to html injected in the innerHTML 

<a href="https://stackblitz.com/edit/ngx-event-handler">Stackblitz</a>


<a href="https://github.com/Marcelh1983/angular-event-handler/blob/master/changelog.md">Changes</a>

### Install the NPM Module
```sh
npm install ngx-event-handler --save
```

### Usage

#### 1. Import `NgxEventHandlerModule` 

```ts
@NgModule({
    imports: [NgxEventHandlerModule]
  })
  export class AppModule { }
```

#### 2. Add handleEvent to a htmlElement:

```html
    <div (handleEvent)="deselect()" [exclusion]="['#buttons', '#text-control']">
``` 

#### API:

Input: 



- exclusion: Array<string> with classes, ids or element names. An event where the target matches one of these elements or it's children won't trigger handleEvent. Example: ['#toolbar, 'button', '.selected']. Default: []
- inclusion: Array<string> with classes, ids or element names. By default all elements, except the ones excluded are included. When providing a list of inclusion elements, it will only trigger Handle event if the target matches the inclusion array (or children) and doesn't match an element in the exclusion array.
- target = 'window': the target where it listens to events.
- event = 'click': the event listened to.
- keepInclusionListInsideDirective = true; when providing inclusion items, if true; these will only be matched with the directive. if false, it matches all elements on the page
- maxLevelup = 20; level of parents that are checked to match a inclusion or exclusion.
- delay = 0; delay before handleEvent is trigged;


Output:
- handleEvent: EventEmitter<HTMLElement>: fires when an element that matches the provided inclusion/exclusion list. By default; if nothing not inputs are provided on the directive, every click will trigger this event.


The function used to create an observable on page events can always be used without the directive.

```js
    createObservableHandler(renderer: Renderer2, target = 'window', event = 'click', delayMs = 0)
```