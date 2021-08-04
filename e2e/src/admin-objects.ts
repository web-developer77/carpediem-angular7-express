import { browser, by, element } from 'protractor';

export class PageObjects {
  navigateTo(section = '') {
    return browser.get('/' + section) as Promise<any>;
  }

  getTitleText() {
    return element(by.css('h1.login_title')).getText() as Promise<string>;
  }

  getSubmitBtn() {
    return element(by.css('[type="submit"]'))
  }

  getEmailInput() {
    return element(by.css('[name="email"]'))
  }

  getPasswordInput() {
    return element(by.css('[name="password"]'))
  }

  getCreateClassBtn() {
    return element(by.css('.btn-gold'))
  }

  getInstructorSelect() {
    return element(by.css('[name="instructor"]'))
  }

  getnstructorOption() {
    return element(by.cssContainingText('.mat-option-text', 'Instructor e2e'))
  }
  
  getClassTypeSelect() {
    return element(by.css('[name="type"]'))
  }

  getClassTypeOption() {
    return element(by.cssContainingText('.mat-option-text', 'Indoor Cycling'))
  }

  getStudioSelect() {
    return element(by.css('[name="studio"]'))
  }

  getStudioOption() {
    return element(by.cssContainingText('.mat-option-text', 'Carso Palmas'))
  }

  getRepeatSelect() {
    return element(by.css('[name="repeat"]'))
  }

  getRepeatOption() {
    return element(by.cssContainingText('.mat-option-text', 'Nunca'))
  }

  getColorSelect() {
    return element(by.css('[name="color"]'))
  }

  getColorOption() {
    return element(by.cssContainingText('.mat-option-text', 'Negro'))
  }

  getAlertSelect() {
    return element(by.css('[name="alert"]'))
  }

  getAlertOption() {
    return element(by.cssContainingText('.mat-option-text', 'Alerta'))
  }

  getDateInput() {
    return element(by.css('[name="date"]'))
  }

  getStartTimeInput() {
    return element(by.css('[name="start"]'))
  }

  getEndTimeInput() {
    return element(by.css('[name="end"]'))
  }

  getClockOption(id) {
    return element.all(by.css('.clock-face__number--outer')).get(id)
  }

  getClickOkBtn() {
    return element.all(by.css('.timepicker-button')).get(1)
  }
}
