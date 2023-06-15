#!/usr/bin/env node

const args = process.argv.slice(2); // Remove the first two elements

// Access the arguments
console.log('Command line arguments:', args);

// Perform actions based on the arguments
if (args.includes('--help')) {
  console.log('Help information');
} else if (args.includes('--version')) {
  console.log('Version information');
} else {
  console.log('Unknown command');
}
