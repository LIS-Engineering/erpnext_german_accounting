frappe.pages['buchungen'].on_page_load = function(wrapper) {
	var page = frappe.ui.make_app_page({
		parent: wrapper,
		title: 'Buchungen',
		single_column: true
	});
	wrapper.test = new erpnext.Buchung(wrapper);
}


frappe.pages['buchungen'].refresh = function(wrapper){
	cur_page.page.page.set_primary_action("Buchen", function () {

    });
    //clear page after "submit" the form
    $('.primary-action:contains("Buchen")').click(function() {
        if(acc.account_soll.get_input_value() && acc.account_haben.get_input_value()){
            frappe.call({
                method: "german_accounting.german_accounting.page.buchungen.buchungen.generate_journal_entries",
                args: {
                    user: frappe.session.user_fullname,
                    acc_soll: acc.account_soll.get_input_value(),
                    voucher_id: acc.voucher_id.get_input_value(),
                    voucher_date: acc.voucher_date.get_input_value(),
                    acc_haben: acc.account_haben.get_input_value(),
                    value: acc.voucher_value.get_input_value(),
                    tax_kind: tax.tax_kind.get_input_value(),
                    tax_code: tax.tax_code.get_input_value(),
                    country_code: tax.country_code.get_input_value(),
                    tax_value: tax.tax_value.get_input_value(),
                    posting_text: tax.posting_text_1.get_input_value(),
                    fiscal_year: acc.fiscal_year.get_input_value(),
                    voucher_netto_value: acc.voucher_netto_value.get_input_value(),
                    booking_type: acc.booking_type.get_input_value(),
                    cost_center: acc.cost_center.get_input_value(),
                    accounting_dimension: acc.accounting_dimension.get_input_value(),
                }
            })
            frappe.ui.toolbar.clear_cache();
        } else {
            alert("Fehlende Felder")
        }
    });

    if (wrapper) {
        wrapper.make_buchung();
    }
}

erpnext.Buchung = class Buchung {
	constructor(wrapper) {
        this.wrapper = $(wrapper).find('.layout-main-section');
        this.page = wrapper.page;

        const assets = [
            'assets/erpnext/js/pos/clusterize.js',
        ];

        frappe.require(assets, () => {
            this.make();
        });

    }

    make() {
        return frappe.run_serially([
            () => frappe.dom.freeze(),
            () => {
                this.prepare_dom();
                this.set_online_status();
            },
            () => this.make_buchung(),
            () => this.make_tax(),
            () => frappe.dom.unfreeze(),
        ]);
    }

	prepare_dom() {
        this.wrapper.append(`
            <div class="pos">
                <section class="account-container">
                </section>
                <section class="tax-container">
                </section>
            </div>
        `);
    }

    set_online_status() {
        this.connection_status = false;
        this.page.set_indicator(__("Offline"), "grey");
        frappe.call({
            method: "frappe.handler.ping",
            callback: r => {
                if (r.message) {
                    this.connection_status = true;
                    this.page.set_indicator(__("Online"), "green");
                }
            }
        });
    }

    make_buchung() {
        this.acc = new Account({
            frm: this.frm,
            wrapper: this.wrapper.find('.account-container'),
        });


    }

    make_tax() {
        this.tax = new Tax({
            frm: this.frm,
            wrapper: this.wrapper.find('.tax-container'),
        });
    }


}

var acc;
class Account {
	constructor({frm, wrapper}) {
        this.frm = frm;
        this.wrapper = wrapper;
        this.make();
        acc = this;
    }


    make() {
        this.make_dom();
        this.make_input_fields();
    }

    make_dom() {
        this.wrapper.append(`
            <div class="account_wrapper">
                <div class="booking_type"> 
                </div><br>
                <div class="account_soll"> 
                </div>
                <div class="voucher_id">
                </div>
                <div class="voucher_date">
                </div>
                <div class="account_haben">
                </div>
                <div class="voucher_value">
                </div>
                <div class="voucher_netto_value">
                </div>
                <div class="fiscal_year">
                </div>
                <div class="cost_center">
                </div>
                <div class="accounting_dimension">
                </div>
            </div>
        `);
    }

    make_input_fields() {

	    this.fiscal_year = frappe.ui.form.make_control({
            df: {
                fieldtype: 'Link',
                label: 'Buchungsjahr',
                fieldname: 'fiscal_year',
                options: 'Fiscal Year',
            },
            parent: this.wrapper.find('.fiscal_year'),
            render_input: true
        });

        this.account_soll = frappe.ui.form.make_control({
            df: {
                fieldtype: 'Link',
                label: 'Sollkonto',
                fieldname: 'account_soll',
                options: 'Account',
            },
            parent: this.wrapper.find('.account_soll'),
            render_input: true
        });

        this.booking_type = frappe.ui.form.make_control({
            df: {
                fieldtype: 'Select',
                label: 'Buchungstyp',
                fieldname: 'booking_type',
                options: ['Buchungssatz','Ausgangsrechnung','Eingangsrechnung'],
                default: 'Buchungssatz',
            },
            parent: this.wrapper.find('.booking_type'),
            render_input: true
        });

        this.account_haben = frappe.ui.form.make_control({
            df: {
                fieldtype: 'Link',
                label: 'Habenkonto',
                fieldname: 'account_haben',
                options: 'Account',
            },
            parent: this.wrapper.find('.account_haben'),
            render_input: true
        });

        this.voucher_date = frappe.ui.form.make_control({
            df: {
                fieldtype: 'Date',
                label: 'Belegdatum',
                fieldname: 'voucher_date',
            },
            parent: this.wrapper.find('.voucher_date'),
            render_input: true
        });

        this.voucher_id = frappe.ui.form.make_control({
            df: {
                fieldtype: 'Data',
                label: 'Belegnummer',
                fieldname: 'voucher_id',
            },
            parent: this.wrapper.find('.voucher_id'),
            render_input: true
        });

        this.voucher_netto_value = frappe.ui.form.make_control({
            df: {
                fieldtype: 'Currency',
                label: 'Nettobetrag',
                fieldname: 'voucher_netto_value',

            },
            parent: this.wrapper.find('.voucher_netto_value'),
            render_input: true
        });
        //alert( "Handler for .change() called." );
        this.voucher_value = frappe.ui.form.make_control({
            df: {
                fieldtype: 'Currency',
                label: 'Betrag',
                fieldname: 'voucher_value',
                change: function () {
                    frappe.call({
                        method: "german_accounting.german_accounting.page.buchungen.buchungen.change_event_value",
                        args: {
                            value: acc.voucher_value.get_input_value(),
                            tax_kind: tax.tax_kind.get_input_value(),
                            tax_code: tax.tax_code.get_input_value(),
                        },
                        callback: function(r) {
                            var res = r.message;
                            $("input[data-fieldname='tax_value']").val(res['tax_value']);
                            $("input[data-fieldname='voucher_netto_value']").val(res['debit_value']);
                        }
                    });
                }
            },
            parent: this.wrapper.find('.voucher_value'),
            render_input: true
        });

        this.cost_center = frappe.ui.form.make_control({
            df: {
                fieldtype: 'Link',
                label: 'Kostenstelle',
                fieldname: 'cost_center',
                options: 'Cost Center',
            },
            parent: this.wrapper.find('.cost_center'),
            render_input: true
        });

        this.accounting_dimension = frappe.ui.form.make_control({
            df: {
                fieldtype: 'Link',
                label: 'Kostenträger',
                fieldname: 'accounting_dimension',
                options: 'Kostentraeger',
            },
            parent: this.wrapper.find('.accounting_dimension'),
            render_input: true
        });
    }
}

var tax;
class Tax {

	constructor({frm, wrapper}) {
        this.frm = frm;
        this.wrapper = wrapper;
        this.make();
        tax = this;
    }

    make() {
        this.make_dom();
        this.make_input_fields();

    }

    make_dom() {
        this.wrapper.append(`
            <div class="tax_wrapper">
                <div class="tax_kind">
                </div>
                <div class="tax_code">
                </div>
                <div class="country_code">
                </div>
                <div class="tax_value">
                </div>
                <div class="posting_text_1">
                </div>
            </div>
        `);
    }

    make_input_fields() {

        this.tax_kind = frappe.ui.form.make_control({
            df: {
                fieldtype: 'Select',
                label: 'Steuerart',
                fieldname: 'tax_kind',
                options: ['0','VS','US'],
                change: function () {
                    if (tax.tax_kind.get_input_value() == "0"){
                      $("input[data-fieldname='tax_code']").val("");
                      $("input[data-fieldname='tax_value']").val("0");
                      $("input[data-fieldname='voucher_netto_value']").val(acc.voucher_value.get_input_value());
                    } else {
                        frappe.call({
                            method: "german_accounting.german_accounting.page.buchungen.buchungen.change_event_value",
                            args: {
                                value: acc.voucher_value.get_input_value(),
                                tax_kind: tax.tax_kind.get_input_value(),
                                tax_code: tax.tax_code.get_input_value(),
                            },
                            callback: function (r) {
                                var res = r.message;
                                $("input[data-fieldname='tax_value']").val(res['tax_value']);
                                $("input[data-fieldname='voucher_netto_value']").val(res['debit_value']);
                            }
                        });
                    }
                }
            },
            parent: this.wrapper.find('.tax_kind'),
            render_input: true
        });

        this.tax_code = frappe.ui.form.make_control({
            df: {
                fieldtype: 'Link',
                label: 'Steuercode',
                fieldname: 'tax_code',
                options: 'Steuercodes',
                change: function () {
                    if (tax.tax_kind.get_input_value() == "0"){
                      $("input[data-fieldname='tax_code']").val("");
                      $("input[data-fieldname='tax_value']").val("0");
                      $("input[data-fieldname='voucher_netto_value']").val(acc.voucher_value.get_input_value());
                    } else {
                        frappe.call({
                            method: "german_accounting.german_accounting.page.buchungen.buchungen.change_event_value",
                            args: {
                                value: acc.voucher_value.get_input_value(),
                                tax_kind: tax.tax_kind.get_input_value(),
                                tax_code: tax.tax_code.get_input_value(),
                            },
                            callback: function (r) {
                                var res = r.message;
                                $("input[data-fieldname='tax_value']").val(res['tax_value']);
                                $("input[data-fieldname='voucher_netto_value']").val(res['debit_value']);
                            }
                        });
                    }
                }
            },
            parent: this.wrapper.find('.tax_code'),
            render_input: true
        });

        this.country_code = frappe.ui.form.make_control({
            df: {
                fieldtype: 'Data',
                label: 'Ländercode',
                fieldname: 'country_code',
            },
            parent: this.wrapper.find('.country_code'),
            render_input: true
        });

        this.tax_value = frappe.ui.form.make_control({
            df: {
                fieldtype: 'Currency',
                label: 'Steuer',
                fieldname: 'tax_value',
                read_only: 0,
            },
            parent: this.wrapper.find('.tax_value'),
            render_input: true
        });

        this.posting_text_1 = frappe.ui.form.make_control({
            df: {
                fieldtype: 'Data',
                label: 'Buchungstext',
            },
            parent: this.wrapper.find('.posting_text_1'),
            render_input: true
        });
    }
}



























