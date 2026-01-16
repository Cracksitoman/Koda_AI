import saveAs from 'file-saver';

/**
 * Saves the current game code as a single HTML file.
 * This allows the user to play the game directly in any browser without extracting a zip.
 */
export const exportGameAsHtml = (code: string, projectName: string) => {
  try {
    const fileName = projectName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    
    // Create a blob with the full HTML code
    const blob = new Blob([code], { type: "text/html;charset=utf-8" });
    
    // Trigger download
    saveAs(blob, `${fileName}.html`);
    
  } catch (error) {
    console.error("Failed to export project:", error);
    throw new Error("Failed to create HTML file.");
  }
};