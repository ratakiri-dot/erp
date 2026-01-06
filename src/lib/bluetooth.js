import { db } from "@/lib/db";

export const printerService = {
    type: 'BLUETOOTH', // 'BLUETOOTH' or 'SYSTEM'
    device: null,
    characteristic: null,

    setType: (type) => {
        printerService.type = type;
        // localStorage.setItem('printer_type', type); // Persist if needed
    },

    // Connect (Only needed for Bluetooth)
    connect: async () => {
        try {
            if (!navigator.bluetooth) {
                alert("Web Bluetooth is not supported. Switching to System Print mode.");
                printerService.type = 'SYSTEM';
                return false;
            }

            console.log('Requesting Bluetooth Device...');
            const device = await navigator.bluetooth.requestDevice({
                filters: [{ services: ['000018f0-0000-1000-8000-00805f9b34fb'] }],
                optionalServices: ['000018f0-0000-1000-8000-00805f9b34fb']
            });

            const server = await device.gatt.connect();
            const service = await server.getPrimaryService('000018f0-0000-1000-8000-00805f9b34fb');
            printerService.characteristic = await service.getCharacteristic('00002af1-0000-1000-8000-00805f9b34fb');
            printerService.device = device;
            printerService.type = 'BLUETOOTH';

            device.addEventListener('gattserverdisconnected', () => {
                printerService.device = null;
                printerService.characteristic = null;
            });

            alert(`Connected to ${device.name}`);
            return true;
        } catch (error) {
            console.error('Bluetooth Error:', error);
            alert("Failed to connect: " + error.message);
            return false;
        }
    },

    print: async function (transaction) {
        const settingsRaw = await db.get('settings');
        const config = settingsRaw[0] || {
            store_name: "RATAKIRI POS",
            store_address: "Jl. Teknologi No. 1",
            footer_message: "TERIMA KASIH",
            show_dash_lines: true,
            show_footer: true,
            printer_type: 'AUTO'
        };
        const pref = config.printer_type || 'AUTO';

        console.log("Printing with preference:", pref);

        if (pref === 'SYSTEM') {
            this.printSystem(transaction, config);
            return;
        }

        if (pref === 'BLUETOOTH') {
            if (this.device && this.device.gatt.connected) {
                const data = this.generateReceiptESC(transaction, config);
                await this.printBluetooth(data);
            } else {
                alert("Printer Bluetooth tidak terhubung! Silakan connect dulu atau ubah ke System Print.");
            }
            return;
        }

        // AUTO MODE
        if (this.device && this.device.gatt.connected) {
            console.log("Auto: Bluetooth connected, using BT.");
            const data = this.generateReceiptESC(transaction, config);
            await this.printBluetooth(data);
        } else {
            console.log("Auto: Bluetooth not connected, falling back to System.");
            this.printSystem(transaction, config);
        }
    },

    // --- BLUETOOTH HELPER ---
    printBluetooth: async function (data) {
        if (!this.characteristic) {
            throw new Error("No characteristic found");
        }
        // Chunking for larger data
        const chunkSize = 512;
        for (let i = 0; i < data.length; i += chunkSize) {
            const chunk = data.slice(i, i + chunkSize);
            await this.characteristic.writeValue(chunk);
        }
    },

    generateReceiptESC: (transaction, config) => {
        // Config passed from print()
        const encoder = new TextEncoder();
        let commands = [];
        const addText = (text) => encoder.encode(text).forEach(b => commands.push(b));
        const addHex = (arr) => arr.forEach(b => commands.push(b));

        const addLine = () => {
            if (config.show_dash_lines) {
                addText("--------------------------------\n");
            } else {
                addText("\n"); // Just a spacer if no line
            }
        };

        addHex([0x1B, 0x40]); // INIT
        addHex([0x1B, 0x61, 0x01]); // CENTER
        addText(`${config.store_name}\n${config.store_address}\n`);
        addLine();

        addHex([0x1B, 0x61, 0x00]); // LEFT
        addText(`No: ${transaction.id.split('_')[1]}\nTgl: ${new Date(transaction.created_at).toLocaleString('id-ID')}\n`); // Schema: created_at
        addLine();

        transaction.items.forEach(item => {
            addText(`${item.qty}x ${item.product.name}\n`);
            addText(`Rp ${(item.qty * item.product.price).toLocaleString()}\n`);
        });

        addLine();
        addHex([0x1B, 0x45, 0x01]); // BOLD ON
        // Schema: grand_total, pay_amount, change
        addText(`TOTAL: Rp ${transaction.grand_total?.toLocaleString() || 0}\n`);
        addHex([0x1B, 0x45, 0x00]); // BOLD OFF

        if (transaction.pay_amount !== undefined) {
            addText(`Bayar: Rp ${transaction.pay_amount.toLocaleString()}\n`);
            addText(`Kembali: Rp ${transaction.change.toLocaleString()}\n`);
        }

        if (config.show_footer) {
            addText(`\n${config.footer_message}\n\n\n`);
        } else {
            addText("\n\n\n");
        }

        return new Uint8Array(commands);
    },

    // --- SYSTEM PRINTER HELPER ---
    printSystem: (transaction, config) => {
        // Config passed from print() or fallback
        if (!config) {
            // Fallback if called directly? usually won't happen
            config = {
                store_name: "RATAKIRI POS",
                store_address: "Jl. Teknologi No. 1",
                footer_message: "TERIMA KASIH",
                show_dash_lines: true,
                show_footer: true
            };
        }

        // Create a hidden iframe or new window to print
        const printWindow = window.open('', '', 'width=300,height=600');
        if (!printWindow) {
            alert("Pop-up blocked. Please allow pop-ups to print.");
            return;
        }

        const html = `
    <html>
        <head>
        <style>
            body { font-family: 'Courier New', monospace; font-size: 12px; width: 100%; margin: 0; padding: 10px; }
            .center { text-align: center; }
            .bold { fontWeight: bold; }
            .line { border-bottom: 1px dashed black; margin: 5px 0; display: ${config.show_dash_lines ? 'block' : 'none'}; }
            .item { display: flex; justify-content: space-between; }
            .right { text-align: right; }
        </style>
        </head>
        <body>
        <div class="center">
            <strong>${config.store_name}</strong><br/>
            ${config.store_address}
        </div>
        <div class="line"></div>
        <div>No: ${transaction.id.split('_')[1]}</div>
        <div>${new Date(transaction.created_at).toLocaleString('id-ID')}</div>
        <div class="line"></div>
        
        ${transaction.items.map(item => `
            <div class="item">
                <span>${item.qty}x ${item.product.name}</span>
            </div>
            <div style="text-align:right">Rp ${(item.qty * item.product.price).toLocaleString()}</div>
        `).join('')}
        
        <div class="line"></div>
        <div style="font-size: 14px; font-weight: bold; text-align: right;">
            TOTAL: Rp ${transaction.grand_total?.toLocaleString() || 0}
        </div>
        
        ${transaction.pay_amount !== undefined ? `
            <div class="item"><span>Bayar</span><span>Rp ${transaction.pay_amount.toLocaleString()}</span></div>
            <div class="item"><span>Kembali</span><span>Rp ${transaction.change.toLocaleString()}</span></div>
        ` : ''}

        <br/>
        ${config.show_footer ? `<div class="center">${config.footer_message}</div>` : ''}
        </body>
    </html>
    `;

        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.focus();
        // Wait for content to load then print
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 500);
    }
};
