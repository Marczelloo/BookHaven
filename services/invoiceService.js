const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// Assume a VAT rate (e.g., 23%)
const VAT_RATE = 0.23;
// Static company/bank details (replace with actual data or load from config)
const COMPANY_NAME = "BookHaven Sp. z o.o.";
const COMPANY_ADDRESS = "ul. Czytelnicza 1, 00-001 Warszawa";
const COMPANY_NIP = "123-456-78-90";
const BANK_ACCOUNT_NUMBER = "PL 12 3456 7890 1234 5678 9012 3456";

class InvoiceService {
    constructor(orderService, userService) {
        this.orderService = orderService;
        this.userService = userService;
        this.invoicesDir = path.join(__dirname, '..', 'invoices');
        // Ensure the invoices directory exists
        if (!fs.existsSync(this.invoicesDir)) {
            fs.mkdirSync(this.invoicesDir, { recursive: true });
        }
    }

    calculatePrices(price) {
        // Add safeguard for invalid input
        if (typeof price !== 'number' || isNaN(price)) {
            console.error(`Invalid price received in calculatePrices: ${price}`);
            // Option 1: Return zero values (might hide underlying data issues)
            // return {
            //     netto: '0.00',
            //     vat: '0.00',
            //     brutto: '0.00'
            // };
            // Option 2: Throw an error to make the problem explicit
            throw new Error(`Invalid price (${price}) passed to calculatePrices.`);
        }

        const netto = price / (1 + VAT_RATE);
        const vatAmount = price - netto;
        return {
            netto: netto.toFixed(2),
            vat: vatAmount.toFixed(2),
            brutto: price.toFixed(2)
        };
    }

    async generateInvoice(orderId) {
        try {
            const order = await this.orderService.getOrderById(orderId);
            if (!order) {
                throw new Error('Order not found');
            }
            // Ensure order includes items, user object, and orderAddress object
            if (!order.items || !order.user || !order.orderAddress) { // Changed userId to user, shippingAddress to orderAddress
                 console.error("Order data incomplete for invoice generation:", order);
                 throw new Error('Order data incomplete for invoice generation.');
            }

            // Use order.user._id to get the user ID string and call the correct static method
            const user = await this.userService.findUserById(order.user._id.toString()); // Changed getUserById to findUserById
             if (!user) {
                 throw new Error('User not found for the order');
             }

             // --- Debug Logging Start ---
             // console.log("--- Generating Invoice --- Order Data:", JSON.stringify(order, null, 2));
             // console.log("--- Generating Invoice --- User Data:", JSON.stringify(user, null, 2));
             // console.log("--- Generating Invoice --- Address Data:", JSON.stringify(order.orderAddress, null, 2));
             // --- Debug Logging End ---

            const doc = new PDFDocument({ margin: 50, autoFirstPage: false }); // Disable auto first page
            doc.addPage(); // Manually add the first page

            const invoiceName = `invoice-${order.orderNumber || orderId}.pdf`;
            const invoicePath = path.join(this.invoicesDir, invoiceName);

            const writeStream = fs.createWriteStream(invoicePath);
            doc.pipe(writeStream);

            // ---- Invoice Header ----
            doc.fontSize(20).font('Helvetica-Bold').text(`Invoice #${order.orderNumber || orderId}`, { align: 'center' });
            doc.moveDown(0.5);
            doc.fontSize(10).font('Helvetica').text(`Date Issued: ${new Date(order.createdAt).toLocaleDateString('pl-PL')}`, { align: 'center' });
            doc.moveDown(2);

            // ---- Seller & Buyer Info ----
            const sellerX = 50;
            const buyerX = 350;
            const startY = doc.y;

            doc.fontSize(12).font('Helvetica-Bold').text('Seller:', sellerX, startY);
            doc.font('Helvetica').text(COMPANY_NAME, sellerX, doc.y + 5);
            doc.text(COMPANY_ADDRESS, sellerX, doc.y + 5);
            doc.text(`NIP: ${COMPANY_NIP}`, sellerX, doc.y + 5);
            doc.text(`Bank Account: ${BANK_ACCOUNT_NUMBER}`, sellerX, doc.y + 5);


            doc.fontSize(12).font('Helvetica-Bold').text('Buyer:', buyerX, startY);
            const buyerName = order.orderAddress.name || user.name;
            const buyerSurname = order.orderAddress.surname || user.surname;
            let currentY = doc.y + 5;
            doc.font('Helvetica').text(`${buyerName} ${buyerSurname}`, buyerX, currentY);

            const address = order.orderAddress;
            currentY = doc.y + 5; // Get Y after previous text
            doc.text(`${address.address || ''}`, buyerX, currentY); // Add fallback for safety

            currentY = doc.y + 5;
            // Explicitly convert zipCode to string
            doc.text(`${String(address.zipCode || '')} ${address.city || ''}`, buyerX, currentY);

            currentY = doc.y + 5;
            doc.text(address.country || '', buyerX, currentY);

            // Explicitly convert phoneNumber to string
            if (address.phoneNumber) {
                currentY = doc.y + 5;
                doc.text(`Phone: ${String(address.phoneNumber)}`, buyerX, currentY);
            }

            currentY = doc.y + 5;
            doc.text(`Email: ${user.email || ''}`, buyerX, currentY);

            // Reset Y position based on the taller block (Seller vs Buyer)
            doc.y = Math.max(doc.y, startY + 5 * 6); // Estimate height based on lines added

            doc.moveDown(3); // Space before items table

            // ---- Items Table ----
            const tableTop = doc.y;
            const itemX = 50;
            const qtyX = 250;
            const nettoX = 300;
            const vatX = 370;
            const bruttoX = 440;
            const totalX = 510;

            doc.fontSize(10).font('Helvetica-Bold');
            doc.text('Item', itemX, tableTop);
            doc.text('Qty', qtyX, tableTop, { width: 40, align: 'right' });
            doc.text('Net Price', nettoX, tableTop, { width: 60, align: 'right' });
            doc.text('VAT', vatX, tableTop, { width: 60, align: 'right' });
            doc.text('Gross Price', bruttoX, tableTop, { width: 60, align: 'right' });
            doc.text('Total Gross', totalX, tableTop, { width: 70, align: 'right' });
            doc.moveTo(itemX, doc.y + 5).lineTo(totalX + 70, doc.y + 5).stroke(); // Header line
            doc.moveDown(0.5);
            doc.font('Helvetica');

            let totalNet = 0;
            let totalVat = 0;
            let totalGross = 0;

            for (const item of order.items) {
                // Check for valid bookId and price within bookId
                if (!item.bookId || typeof item.bookId.price !== 'number' || isNaN(item.bookId.price)) {
                    console.error(`Invalid or missing price/bookId for item:`, item);
                    throw new Error(`Invalid or missing price/bookId for item in order ${orderId}`);
                }

                const price = item.bookId.price; // Get price from bookId
                const title = item.bookId.title; // Get title from bookId

                const prices = this.calculatePrices(price); // Use price from bookId
                const itemTotalGross = price * item.quantity; // Use price from bookId
                const itemTotalNet = parseFloat(prices.netto) * item.quantity;
                const itemTotalVat = parseFloat(prices.vat) * item.quantity;

                totalNet += itemTotalNet;
                totalVat += itemTotalVat;
                totalGross += itemTotalGross;

                const y = doc.y;
                doc.text(title, itemX, y, { width: 190 }); // Use title from bookId
                doc.text(item.quantity.toString(), qtyX, y, { width: 40, align: 'right' });
                doc.text(prices.netto, nettoX, y, { width: 60, align: 'right' });
                doc.text(prices.vat, vatX, y, { width: 60, align: 'right' });
                doc.text(prices.brutto, bruttoX, y, { width: 60, align: 'right' });
                doc.text(itemTotalGross.toFixed(2), totalX, y, { width: 70, align: 'right' });
                doc.moveDown(0.5);
            }

            doc.moveTo(itemX, doc.y).lineTo(totalX + 70, doc.y).stroke(); // Footer line
            doc.moveDown(1);

            // ---- Totals ----
            const totalsX = 400;
            doc.font('Helvetica-Bold');
            doc.text('Total Net:', totalsX, doc.y, { width: 100, align: 'left' });
            doc.text(`${totalNet.toFixed(2)} USD`, totalX, doc.y - 12, { width: 70, align: 'right' }); // Changed PLN to USD
            doc.moveDown(0.5);

            doc.text('Total VAT:', totalsX, doc.y, { width: 100, align: 'left' });
            doc.text(`${totalVat.toFixed(2)} USD`, totalX, doc.y - 12, { width: 70, align: 'right' }); // Changed PLN to USD
            doc.moveDown(0.5);

            doc.fontSize(12); // Make total gross slightly larger
            doc.text('Total Gross:', totalsX, doc.y, { width: 100, align: 'left' });
            doc.text(`${totalGross.toFixed(2)} USD`, totalX, doc.y - 14, { width: 70, align: 'right' }); // Changed PLN to USD
            doc.moveDown(1);
            doc.fontSize(10).font('Helvetica'); // Reset font size


            // --- Discount ---
             if (order.discountAmount && order.discountAmount > 0) {
                 doc.font('Helvetica-Bold');
                 doc.text('Discount Applied:', totalsX, doc.y, { width: 100, align: 'left' });
                 doc.text(`-${order.discountAmount.toFixed(2)} USD`, totalX, doc.y - 12, { width: 70, align: 'right' }); // Changed PLN to USD
                 doc.moveDown(0.5);

                 doc.fontSize(12); // Make final total slightly larger
                 doc.text('Final Amount Paid:', totalsX, doc.y, { width: 100, align: 'left' });
                 doc.text(`${order.totalAmount.toFixed(2)} USD`, totalX, doc.y - 14, { width: 70, align: 'right' }); // Changed PLN to USD
                 doc.moveDown(1);
                 doc.fontSize(10).font('Helvetica'); // Reset font size
             } else {
                 // If no discount, the Total Gross is the Final Amount Paid
                 doc.fontSize(12); // Make final total slightly larger
                 doc.text('Final Amount Paid:', totalsX, doc.y, { width: 100, align: 'left' });
                 doc.text(`${order.totalAmount.toFixed(2)} USD`, totalX, doc.y - 14, { width: 70, align: 'right' }); // Changed PLN to USD
                 doc.moveDown(1);
                 doc.fontSize(10).font('Helvetica'); // Reset font size
             }


            // ---- Payment Method ----
            doc.moveDown(2);
            doc.font('Helvetica-Bold').text('Payment Method:', 50, doc.y);
            // Use order.paymentMethod if available, otherwise default to 'Card Payment'
            const paymentMethodText = order.paymentMethod || 'Card Payment';
            doc.font('Helvetica').text(paymentMethodText, 150, doc.y - 12); // Adjust x pos

            // ---- Footer ----
            const pageHeight = doc.page.height;
            doc.fontSize(8).font('Helvetica-Oblique')
               .text('Thank you for your business!', 50, pageHeight - 50, { align: 'center', width: 500 });


            // Finalize PDF file
            doc.end();

            return new Promise((resolve, reject) => {
                writeStream.on('finish', () => resolve({ success: true, path: invoicePath, name: invoiceName }));
                writeStream.on('error', (err) => {
                    console.error("Error writing PDF stream:", err);
                    reject(new Error('Failed to write invoice PDF'));
                });
            });

        } catch (error) {
            console.error("Error generating invoice:", error);
            throw error; // Re-throw the error to be handled by the caller
        }
    }
}

module.exports = InvoiceService;
