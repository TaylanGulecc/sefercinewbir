import { When } from '../fixtures';

When(
    'user successfully logs into the system',
    async ({ dashboardPage }) => {
        await dashboardPage.merhabaVisible();
    }
);

When(
    'user clicks home page',
    async ({ dashboardPage }) => {
        await dashboardPage.clickHome();
        console.log('🏠 Home page clicked');
    }
);
