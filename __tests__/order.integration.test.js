const mongoose = require('mongoose');
const OrderService = require('../models/orderService');
const UserService = require('../models/userService');
const InvoiceService = require('../services/invoiceService');
const PaymentService = require('../models/paymentService');
const Order = require('../models/order');
const User = require('../models/user');
const Book = require('../models/book');
const Address = require('../models/orderAddress');
const fs = require('fs');
const path = require('path');

// Mock dependencies
jest.mock('../models/order');
jest.mock('../models/user');
jest.mock('../models/book');
jest.mock('../models/orderAddress');
jest.mock('../models/paymentService'); // Mock payment service to simulate success/failure

// Mock fs selectively: allow reads for pdfkit fonts, mock writes
jest.mock('fs', () => {
    const originalFs = jest.requireActual('fs');
    const EventEmitter = require('events'); // Import EventEmitter

    // Create a more complete mock stream that inherits from EventEmitter
    class MockWriteStream extends EventEmitter {
        constructor() {
            super();
            this.writable = true; // Indicate it's writable
        }
        write = jest.fn();
        end = jest.fn(() => {
            // Simulate the 'finish' event asynchronously
            setImmediate(() => this.emit('finish'));
        });
        // Add other methods if needed, like cork(), uncork(), setDefaultEncoding(), destroy()
        // The key is that it now has .on(), .once(), .emit() from EventEmitter
    }

    const mockWriteStreamInstance = new MockWriteStream();

    return {
        ...originalFs,
        existsSync: jest.fn().mockReturnValue(true),
        mkdirSync: jest.fn().mockReturnValue(undefined),
        createWriteStream: jest.fn().mockReturnValue(mockWriteStreamInstance),
        // Ensure statSync is available if pdfkit needs it
        statSync: originalFs.statSync,
        // Add mocks for any other write operations if necessary
    };
});

// --- Test Setup ---
let mockUser;
let mockBook1, mockBook2;
let mockAddress;
let mockOrder;
let invoiceService;

beforeAll(async () => {
    // Basic setup, can connect to a test DB if needed, but mocking is often sufficient for integration tests
    // mongoose.connect(process.env.MONGO_TEST_URI || 'mongodb://localhost:27017/bookhaven-test');

    // Instantiate services with mocked models/dependencies
    invoiceService = new InvoiceService(OrderService, UserService);
});

beforeEach(() => {
    // Reset mocks and create fresh mock data before each test
    jest.clearAllMocks();

    mockUser = {
        _id: new mongoose.Types.ObjectId('677d6750d6d24e3df4811a97'),
        name: 'Test',
        surname: 'User',
        email: 'test@example.com',
        phoneNumber: '123456789',
        // Add other necessary user fields
    };

    mockBook1 = {
        _id: new mongoose.Types.ObjectId('677d4ddbbe067fc8e52fc0ea'),
        title: 'Test Book One',
        author: 'Author One',
        price: 19.99,
        // Add other necessary book fields
    };
    mockBook2 = {
        _id: new mongoose.Types.ObjectId('677d4ddbbe067fc8e52fc0d6'),
        title: 'Test Book Two',
        author: 'Author Two',
        price: 25.50,
        // Add other necessary book fields
    };

    mockAddress = {
        _id: new mongoose.Types.ObjectId(),
        user: mockUser._id,
        name: 'Test',
        surname: 'User',
        phoneNumber: '123456789',
        address: '123 Test St', // Simplified address for testing
        city: 'Testville',
        country: 'Testland',
        zipCode: '12345',
        // Add other necessary address fields
    };

    mockOrder = {
        _id: new mongoose.Types.ObjectId('67fbd6d70c156bfb6c8525a8'),
        user: mockUser, // Populated user
        items: [
            { bookId: mockBook1, quantity: 1, price: mockBook1.price, title: mockBook1.title }, // Add title for invoice
            { bookId: mockBook2, quantity: 1, price: mockBook2.price, title: mockBook2.title }, // Add title for invoice
        ],
        orderAddress: mockAddress, // Populated address
        totalAmount: 50.49, // Example total (19.99 + 25.50 + 5 shipping)
        status: 'pending_payment',
        createdAt: new Date(),
        // Add other necessary order fields like currency, discountAmount etc.
        discountAmount: 0,
        paymentMethod: 'Credit Card', // Example
        orderNumber: 'TEST-123', // Example
        save: jest.fn().mockResolvedValue(this), // Mock save method
    };

    // --- Mock Implementations ---

    // Mock OrderService static methods
    OrderService.getOrderById = jest.fn().mockResolvedValue(mockOrder);
    OrderService.updateOrder = jest.fn().mockImplementation(async (orderId, updateData) => {
        // Simulate updating the mock order
        Object.assign(mockOrder, updateData);
        return mockOrder;
    });

    // Mock UserService static methods
    UserService.findUserById = jest.fn().mockResolvedValue(mockUser);

    // Mock PaymentService static methods
    PaymentService.processPayment = jest.fn().mockResolvedValue({ success: true, message: 'Payment successful' });

});

// --- Test Cases ---

describe('Invoice Generation', () => {
    it('should generate an invoice PDF after successful payment', async () => {
        // 1. Simulate successful payment (already mocked to succeed)
        const paymentResult = await PaymentService.processPayment({ orderId: mockOrder._id /* ... other details */ });
        expect(paymentResult.success).toBe(true);
        expect(PaymentService.processPayment).toHaveBeenCalled();

        // 2. Trigger invoice generation (as done in paymentController)
        let invoiceResult;
        let updatePayload;
        if (paymentResult.success) {
            try {
                invoiceResult = await invoiceService.generateInvoice(mockOrder._id);
                if (invoiceResult.success) {
                    updatePayload = {
                        invoicePath: invoiceResult.path,
                        invoiceGeneratedAt: expect.any(Date) // Check if it's a Date object
                    };
                    await OrderService.updateOrder(mockOrder._id, updatePayload);
                }
            } catch (error) {
                console.error("Test Error during invoice generation:", error);
                // Fail test if invoice generation throws unexpectedly
                throw error;
            }
        }

        // 3. Assertions
        expect(invoiceResult).toBeDefined();
        expect(invoiceResult.success).toBe(true);
        expect(invoiceResult.path).toMatch(/invoices[\\/]invoice-.*\.pdf$/); // Check path format
        expect(fs.createWriteStream).toHaveBeenCalledWith(invoiceResult.path);

        // Check that OrderService.updateOrder was called with the correct path
        expect(OrderService.updateOrder).toHaveBeenCalledWith(mockOrder._id, updatePayload);

        // Check that the mock order object was updated (optional, depends on mock implementation)
        // expect(mockOrder.invoicePath).toBe(invoiceResult.path);
        // expect(mockOrder.invoiceGeneratedAt).toEqual(expect.any(Date));
    });

    it('should handle errors during invoice generation gracefully', async () => {
        // Arrange: Make OrderService.getOrderById return incomplete data
        const incompleteOrder = { ...mockOrder, user: null }; // Simulate missing user
        OrderService.getOrderById.mockResolvedValueOnce(incompleteOrder);

        // Act & Assert: Expect generateInvoice to throw the specific error
        await expect(invoiceService.generateInvoice(mockOrder._id))
            .rejects
            .toThrow('Order data incomplete for invoice generation.');

        // Ensure file system wasn't touched
        expect(fs.createWriteStream).not.toHaveBeenCalled();
        expect(OrderService.updateOrder).not.toHaveBeenCalled();
    });

     it('should handle errors when user is not found', async () => {
        // Arrange: Make UserService.findUserById return null
        UserService.findUserById.mockResolvedValueOnce(null);

        // Act & Assert: Expect generateInvoice to throw the specific error
        await expect(invoiceService.generateInvoice(mockOrder._id))
            .rejects
            .toThrow('User not found for the order');

        // Ensure file system wasn't touched
        expect(fs.createWriteStream).not.toHaveBeenCalled();
        expect(OrderService.updateOrder).not.toHaveBeenCalled();
    });

    // Add more tests:
    // - Test calculatePrices method
    // - Test PDF content generation (more complex, might require pdf-parse or visual regression)
    // - Test error handling for file system write errors
});

// Add tests for OrderService.placeOrder, downloadInvoice controller, etc.

afterAll(async () => {
    // Disconnect mongoose if connected
    // await mongoose.disconnect();
});
