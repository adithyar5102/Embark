import React, { useState } from 'react';
import { Snackbar, Alert, Button, Box, AlertTitle, Slide } from '@mui/material';
import { styled } from '@mui/material/styles';

// Styled Alert component for a custom look
const StyledAlert = styled(Alert)(({ theme, severity }) => {
  let backgroundGradient;
  let textColor = theme.palette.common.white; // Default text color

  // Determine the background gradient based on severity
  switch (severity) {
    case 'success':
      backgroundGradient = 'linear-gradient(45deg, #4caf50 30%, #66bb6a 90%)';
      break;
    case 'info':
      backgroundGradient = 'linear-gradient(45deg, #2196f3 30%, #42a5f5 90%)';
      break;
    case 'warning':
      backgroundGradient = 'linear-gradient(45deg, #ff9800 30%, #ffb74d 90%)';
      break;
    case 'error':
      backgroundGradient = 'linear-gradient(45deg, #f44336 30%, #ef5350 90%)';
      break;
    default:
      backgroundGradient = 'linear-gradient(45deg, rgba(255, 255, 255, 0.9), rgba(240, 240, 255, 0.9))';
      textColor = theme.palette.text.primary; // For default, use primary text color
      break;
  }

  return {
    boxShadow: theme.shadows[6],
    borderRadius: theme.shape.borderRadius,
    background: backgroundGradient,
    color: textColor, // Set text color based on the background
    display: 'flex',
    alignItems: 'center',
    '& .MuiAlert-icon': {
      color: textColor, // Ensure icon color matches text
    },
    '& .MuiAlert-message': {
      fontWeight: 500,
      fontSize: '1rem',
    },
  };
});

interface ReusableSnackbarProps {
  open: boolean;
  message: string;
  severity: 'success' | 'info' | 'warning' | 'error';
}

// Main reusable snackbar component
// It accepts props to control its behavior and content
const ReusableSnackbar = ({ open, message, severity }: ReusableSnackbarProps) => {
  // Use Slide for a smooth transition effect
  const Transition = (props: any) => {
    return <Slide {...props} direction="down" />;
  };

  console.log('Snackbar rendered with message:', message, 'and severity:', severity);

  return (
    <Snackbar
      open={open}
      autoHideDuration={6000} // The message will disappear after 6 seconds
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }} // Position the snackbar at the top center
      TransitionComponent={Transition} // Apply the custom slide transition
    >
      <StyledAlert
        severity={severity}
        variant="filled" // Using filled variant for a better visual
        sx={{ width: '100%' }} // Ensure the alert takes full width inside the snackbar
      >
        <AlertTitle sx={{ m: 0, fontWeight: 'bold' }}>
          {/* Display a title based on severity */}
          {severity === 'success' && 'Success!'}
          {severity === 'error' && 'Error!'}
          {severity === 'warning' && 'Warning!'}
          {severity === 'info' && 'Info!'}
        </AlertTitle>
        {message}
      </StyledAlert>
    </Snackbar>
  );
};

export default ReusableSnackbar;