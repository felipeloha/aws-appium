import AppScreen from './app.screen';

const SELECTORS = {
    ITEM: 'android=new UiSelector().resourceId("android:id/text1")'
};

class HomeScreen extends AppScreen {
    constructor () {
        super(SELECTORS.ITEM);
    }

    get getItem () {
        return $(SELECTORS.ITEM);
    }
}

export default new HomeScreen();
