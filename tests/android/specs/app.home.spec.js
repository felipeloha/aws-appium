import HomeScreen from '../screenobjects/home.screen';

describe('Validate home page', () => {
    beforeEach(() => {
        HomeScreen.waitForIsShown(true);
    });

    it('should be able to validate item', () => {
        HomeScreen.getItem.click();
    });
});
