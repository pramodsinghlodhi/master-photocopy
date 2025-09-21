'use client';

import { useConfirmationAlert } from '@/hooks/use-confirmation-alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TestAlerts() {
  const { showConfirmation, showSuccessAlert, showErrorAlert, confirmAndExecute } = useConfirmationAlert();

  const handleTestConfirmation = async () => {
    const confirmed = await showConfirmation({
      title: 'Test Confirmation',
      message: 'This is a test confirmation dialog. Do you want to proceed?',
      confirmText: 'Yes, proceed',
      cancelText: 'Cancel',
      type: 'question'
    });

    if (confirmed) {
      showSuccessAlert({
        title: 'Confirmed!',
        description: 'You clicked confirm and this success message appeared.'
      });
    }
  };

  const handleTestError = () => {
    showErrorAlert({
      title: 'Test Error',
      description: 'This is a test error message with toast notification.',
      showAlert: true
    });
  };

  const handleTestSuccess = () => {
    showSuccessAlert({
      title: 'Test Success',
      description: 'This is a test success message with both alert and toast.',
      showAlert: true
    });
  };

  const handleConfirmAndExecute = () => {
    confirmAndExecute(
      {
        title: 'Dangerous Action',
        message: 'This will perform a dangerous action. Are you sure?',
        confirmText: 'Yes, do it!',
        cancelText: 'Cancel',
        type: 'warning'
      },
      async () => {
        // Simulate some async action
        await new Promise(resolve => setTimeout(resolve, 1000));
        throw new Error('Simulated error for testing');
      },
      {
        title: 'Action Completed',
        description: 'The dangerous action was completed successfully.'
      },
      {
        title: 'Action Failed',
        description: 'The dangerous action failed to complete.'
      }
    );
  };

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>SweetAlert2 + Toast Integration Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button onClick={handleTestConfirmation} variant="default">
              Test Confirmation Dialog
            </Button>
            
            <Button onClick={handleTestSuccess} variant="default">
              Test Success Alert
            </Button>
            
            <Button onClick={handleTestError} variant="destructive">
              Test Error Alert
            </Button>
            
            <Button onClick={handleConfirmAndExecute} variant="outline">
              Test Confirm & Execute
            </Button>
          </div>
          
          <div className="mt-6 p-4 bg-muted rounded-lg">
            <h3 className="font-semibold mb-2">Features Demonstrated:</h3>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>• SweetAlert2 confirmation dialogs with custom styling</li>
              <li>• Combined SweetAlert2 + Toast notifications</li>
              <li>• Confirm and execute pattern with error handling</li>
              <li>• Success and error alerts with optional modal display</li>
              <li>• Consistent theming with your app's design</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}