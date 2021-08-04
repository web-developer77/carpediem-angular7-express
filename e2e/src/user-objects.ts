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

  getProfileLink() {
    return element(by.css('.my-account > span > a'))
  }

  getTitleTextSignedIn() {
    return element(by.css('h1.title-line__main'));
  }

  getUserProfileTitle() {
    return element(by.css('h1.title-line__secondary'))
  }

  getBuyLinkBtn() {
    return element(by.css('.form__btn button.btn.btn-brown.btn-block'))
  }

  getPackageBtn(index) {
    return element(by.id('plan-' + index))
  }

  getCardForm() {
    return [
      element(by.css('[name="holder_name"]')),
      element(by.css('[name="card_number"]')),
      element(by.css('[name="expiration_month"]')),
      element(by.css('[name="expiration_year"]')),
      element(by.css('[name="cvv2"]'))
    ]
  }

  getConfirmationModalTitle() {
    return element(by.css('.swal2-modal.show-swal2.visible h2'))
  }

  getModalConfirmationBtn() {
    return element(by.css('.swal2-confirm'))
  }

  getUserCreditsCount() {
    return element(by.css('.account-container__available__info'))
  }

  getActiveBookingFilter() {
    return element(by.css('.gold-hover.top-btn.active'))
  }

  getE2eClassBtn() {
    return element(by.css('.book-calendar__head .col:nth-child(4) .book-calendar__timetable:last-child'))
  }

  async getFirstBike() {
    const el = element.all(by.css('.btn-circle'))
    const cnt:number = await el.count()
    const rand = Math.floor((cnt - 1) * Math.random())

    return el.get(rand)
  }

  getContinueBtn() {
    return element(by.css('.btn.btn-black.btn-lg.btn-block'))
  }

  getConfimationScreenBtn() {
    return element(by.css('.btn.btn-light.btn-block'))
  }
}
