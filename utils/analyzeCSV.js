const fs = require('fs');
const csv = require('csv-parser');

const analyzeCSV = (filePath) => {
  return new Promise((resolve, reject) => {
    const userSummary = {};
    const userTotals = {};
    let rowCount = 0;

    const readableStream = fs.createReadStream(filePath)
      .on('error', (err) => {
        reject(new Error('Unable to read CSV file.'));
      });

    readableStream
      .pipe(csv())
      .on('data', (row) => {
        rowCount++;
        try {
          const { TransactionID, UserID, Date, Amount, 'Transaction Type': Type } = row;

          // Validate required fields
          if (!TransactionID || !UserID || !Amount || !Type) {
            console.warn(`Skipping row ${rowCount} due to missing fields.`);
            return;
          }

          const amount = parseFloat(Amount);
          if (isNaN(amount)) {
            console.warn(`Skipping row ${rowCount}: Invalid amount.`);
            return;
          }

          const normalizedType = Type.trim().toLowerCase();
          if (normalizedType !== 'credit' && normalizedType !== 'debit') {
            console.warn(`Skipping row ${rowCount}: Invalid transaction type.`);
            return;
          }

          const typeKey = normalizedType.charAt(0).toUpperCase() + normalizedType.slice(1);

          if (!userSummary[UserID]) {
            userSummary[UserID] = { Credit: 0, Debit: 0 };
            userTotals[UserID] = 0;
          }

          userSummary[UserID][typeKey] += amount;
          userTotals[UserID] += amount;

        } catch (err) {
          console.warn(`Error processing row ${rowCount}:`, err.message);
        }
      })
      .on('end', () => {
        if (rowCount === 0) {
          return reject(new Error('CSV is empty or not formatted correctly.'));
        }

        let topUser = null;
        let maxAmount = 0;

        for (const [userId, total] of Object.entries(userTotals)) {
          if (total > maxAmount) {
            maxAmount = total;
            topUser = userId;
          }
        }

        resolve({
          summary: userSummary,
          highestTransactionUser: topUser
            ? { UserID: topUser, TotalAmount: maxAmount }
            : null
        });
      })
      .on('error', (err) => {
        reject(new Error('Error occured.'));
      });
  });
};

module.exports = analyzeCSV;
