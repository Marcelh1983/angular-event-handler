import { Component } from '@angular/core';
import { SafeHtml, DomSanitizer } from '@angular/platform-browser';

export class Word {
  id: number;
  text: string;
  selected: boolean;
  classes: string;
}

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styles: [`
  .selected {
    background-color: lightpink;
}

.underline {
    text-decoration: underline;
}

.bold {
    font-weight: bold;
}
`]
})
export class AppComponent {
  linkClickedText = '';
  html: SafeHtml;
  boldApplied = false;
  underlineApplied = false;
  selectedWord: Word = null;
  selectedText = '';
  words: Word[] = 'Click a word to select a word. You can set a style by clicking a button. Clicking outside the text or button will cancel the selection'.split(' ')
    .map((word, index) => ({
      id: index,
      text: word,
      selected: false,
      classes: ''
    }));
  inclusionWords: Word[] = `Again, click a word to select.
  But instead of add the click event on the span, add a click event for all .span-word elements.
  Clicking the words above don't trigger the handle event because inclusions are by default within the directive only.`.split(' ')
    .map((word, index) => ({
      id: index,
      text: word,
      selected: false,
      classes: ''
    }));

  constructor(sanitizer: DomSanitizer) {
    this.html = sanitizer.bypassSecurityTrustHtml(
      `<div>
        Here two links added using the innerHTML.
        Link click can be handled using this package.
        Click the links to preview:
          <a href="/link1">Link 1</a>
          and
          <a href="/link2">Link 2</a>
      </div>`
        .replace(/href=/gi, ` onclick='return false;' href=`));
  }
  trackById(index: number, word: Word) {
    return word.id;
  }
  handleSpanClick(element: HTMLElement) {
    this.selectedText = element.innerText;
  }

  selectWord(word: Word) {
    this.words = this.words.map(w => {
      if (w.selected && w.id !== word.id) {
        return { ...w, selected: false };
      } else if (w.id === word.id) {
        return { ...w, selected: !word.selected }; // toggle
      } else {
        return w;
      }
    });
    this.boldApplied = word.classes.includes('bold');
    this.underlineApplied = word.classes.includes('underline');
    this.selectedWord = this.words.find(w => w.selected);
  }

  deselect() {
    this.words = this.words.map(w => {
      return w.selected ? { ...w, selected: false } : w;
    });
    this.selectedWord = null;
  }

  toggleClass(word: Word, classname: string) {
    this.words = this.words.map(w => {
      if (w.id === word.id) {
        const classes = w.classes.split(' ');
        if (classes.includes(classname)) {
          return { ...w, classes: classes.filter(bw => bw !== classname).join(' ') };
        } else {
          return { ...w, classes: [...classes, classname].join(' ') };
        }
      }
      return w;
    });
  }

  linkClicked(element: HTMLElement) {
    const anchor = element as HTMLAnchorElement;
    const relativeUrl = anchor.href.replace(window.location.origin, '');
    console.log('nav to: ', relativeUrl);
    this.linkClickedText = `clicked: ${relativeUrl}, so we could use:  this.router.navigate([relativeUrl])`;
  }
}
