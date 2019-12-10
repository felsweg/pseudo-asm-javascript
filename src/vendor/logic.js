var init_logic = function () {
    let ta = document.getElementById("code_editor");
    let btn_advance = document.getElementById("adv");
    let btn_reset = document.getElementById("rst");
    let ta_stack = document.getElementById("code_stack");

    let code_changed = true;

    // display vars
    let l_acc = document.getElementById('label_acc');
    let l_bak = document.getElementById('label_bak');
    let l_tst = document.getElementById('label_tst');
    let l_stat = document.getElementById('status');

    let stack = {
        'data': new Array(),
        'index': 0,
        'empty': function () {
            return this.data.length == 0;
        },
        'push': function (a) {
            this.data.push(a);
        },
        'pop': function () {
            if (this.empty()) {
                throw new Error();
            }

            return this.data.pop();
        }
    };

    let update_stack_display = function () {

        let _stack = cpu.get_stack();
        let _text = "";
        for (i = 0; i < _stack.length; i++) {
            let element = _stack[i];
            if (element == undefined) {
                //element = "";
                continue;
            }
            _text += element + "\n";
        }

        ta_stack.value = _text;
    }

    ta.onkeydown = function () {
        console.log("code changed");
        code_changed = true;
    }

    window.onerror = function (e) {
        l_stat.innerHTML = "<div style='color: #ff0000'>" + e + "</div>";
    };

    let line_positions = [];

    let update_line_positions = function () {
        // debugger;
        ta.value = fill_empty_space(ta.value, ta.cols);
        let values = ta.value.split("\n");
        let line = 0;
        let start = 0;
        let num_lines = values.length;

        line_positions = [];

        let _end = 0;
        while (line < num_lines) {

            // skip labels
            let label_tst = new RegExp("^[a-z]+\:.*$");
            if (label_tst.test(values[line])) {
                start += values[line].length + 1;
                line = line + 1;
                continue;
            }

            let empty = /^[\s]*$/g;
            if (empty.test(values[line])) {
                start += values[line].length + 1;
                line = line + 1;
                continue;
            }

            line_positions.push({
                'begin': start,
                'end': start + values[line].length + 1
            })

            // update positions
            start += values[line].length + 1;
            line = line + 1;

            // skip empty line



        }
    }

    // update_line_positions();

    let highlight_step = function () {
        // console.log("pc=" + cpu.get_pc());
        let lp = line_positions[cpu.get_pc()];
        ta.focus();
        ta.selectionStart = lp.begin;
        ta.selectionEnd = lp.end;
    };

    // select first line. maybe this is just crap calling this here
    // but it does it's job, so who cares.
    // highlight_step();

    // configure buttons
    let advance = function () {
        if (code_changed) {
            cpu.reset_all();
            cpu.compile(ta.value);

            update_line_positions();

            code_changed = false;
            l_stat.innerHTML = "<div style='color: #00ae00; font-size:2.0em'>OK</div>";
        }

        if (cpu.memory.length == 0) {
            cpu.compile(ta.value);
        }
        // execute instruction. increase pc afterwards.
        cpu.execute();

        // update step highlighting
        highlight_step();

        l_acc.innerHTML = label_text(cpu.get_acc());
        l_bak.innerHTML = label_text(cpu.get_bak());
        l_tst.innerHTML = label_text(cpu.get_flg());


        update_stack_display();
    };

    btn_reset.onclick = function () {
        line = 0;
        start = 0;

        cpu.reset_all();
    };

    btn_advance.onclick = advance;

    // test automatic playback
    // setTimeout(function () {
    //     setInterval(advance, 50);
    // }, 10);



};

function label_text(text) {
    return "<div class='display_info'>" + text + "</div>"
}

// fills the empty space with blank spaces
// between instructions  to make the 
// highlighting more pleasant ;)
function fill_empty_space(e, cols) {

    let split = e.split("\n");
    let text = "";

    for (i = 0; i < split.length; i++) {
        let line = split[i];
        let fill = clamp(cols - line.length);
        line += " ".repeat(fill);
        if (i == split.length - 1) {
            text += line;
        } else {
            text += line + "\n";
        }
    }
    return text;
}

// clamp values below 0 to 0
function clamp(x) {
    return (x < 0) ? 0 : x;
}

/// logic
var cpu = {
    'labels': [],
    'memory': [],
    'set_acc': function (v) {
        this.registers.acc = v;
    },
    'add_acc': function (v) {
        if (v > 10000 || v < -10000) {
            throw new Error("Value out of range");
        }
        this.registers.acc += v;
    },
    'sub_acc': function (v) {
        if (v > 10000 || v < -10000) {
            throw new Error("Value out of range");
        }
        this.registers.acc -= v;
    },
    'mul_acc': function (v) {
        if (v > 100 || v < -100) {
            throw new Error("Value out of range");
        }
        this.registers.acc *= v;
    },
    'div_acc': function (v) {
        if (v == 0) {
            throw new Error("Can't divide by zero!")
        }

        if (v > 100 || v < -100) {
            throw new Error("Value out of range");
        }

        this.registers.acc /= v;
    },
    'mod_acc': function (v) {
        if (v < 1) {
            throw new Error("Can't divide by zero");
        }

        this.registers.acc %= v;
    },
    'get_acc': function (v) {
        return this.registers.acc;
    },
    'set_bak': function (v) {
        this.registers.bak = v;
    },
    'get_bak': function (v) {
        return this.registers.bak;
    },
    'set_flg': function (v) {
        this.registers.flg = v;
    },
    'get_flg': function () {
        return this.registers.flg;
    },
    'is_tst_zero': function () {
        return this.registers.flg == 0;
    },
    'is_tst_gtz': function () {
        return this.registers.flg > 0;
    },
    'is_tst_ltz': function () {
        return this.registers.flg < 0;
    },
    'set_pc': function (p) {
        this.registers.pc = p;
    },
    'get_pc': function () {
        return this.registers.pc;
    },
    'inc_pc': function () {
        this.registers.pc += 1;

        //  This resets the pc
        if (this.registers.pc == this.memory.length) {
            this.registers.pc = 0;
        }
    },
    'dec_pc': function () {
        if (this.registers.pc == 0) {
            return;
        }

        this.registers.pc -= 1;
    },
    'push_stack': function (v) {

        this.registers.sp++;
        if (this.registers.sp > 15) {
            throw new Error("Stack overflow!");
        }
        console.log(this.registers.sp);
        this.registers.stack.push(v);//stack[this.registers.sp--] = v;
    },
    'pop_stack': function () {
        this.registers.sp--;

        if (this.registers.sp < 0) {
            throw new Error("Stack is empty!");
        }
        return this.registers.stack.pop(); //stack[this.sp++];
    },
    'get_stack': function () {
        return this.registers.stack;
    },
    'registers': {
        'acc': 0,
        'bak': 0,
        'flg': 0,
        'bak': 0,
        'pc': 0,
        'stack': [],
        'sp': 0
    },
    'reset': function () {
        this.memory = [];
        this.labels = [];
    },
    'reset_all': function () {
        this.memory = [];
        this.labels = [];
        this.registers.acc = 0;
        this.registers.bak = 0;
        this.registers.flg = 0;
        this.registers.pc = 0;
    },

    'execute': function () {
        this.memory[this.get_pc()](this);
        this.inc_pc();
    },

    // this function 'compiles' the given code into
    // an array of instructions (functions in this case) modifying
    // the registers of the virtual cpu. 
    // the stream of token gets parsed and transformed into the appropriate function
    // calls. 
    'compile': function (cc) {

        // clean up non-tokens
        let code = cc
            .replace(/\n/g, " ")
            .replace(/\,/g, " ")
            .split(" ")
            .map(function (v) {
                return v.toLowerCase();
            })
            .filter(function (v) {
                return v.length != 0;
            });

        // the 'lexer' stores all tokens
        // and returns the next
        let lex = {
            'pos': 0,
            'length': code.length,
            'stream': code,
            'next': function () {
                if (this.pos == this.length) {
                    // this.pos = 0;
                    throw new Error("End Of Stream");
                }
                // debugger;
                return this.stream[this.pos++];
            },
            'has_next': function () {
                return (this.pos) < this.length;
            }
        };


        // define a label stack to store the last defined
        // label. the next successfully parsed instruction 
        // is the pc's target. in case multiple labels are
        // being defined in succession, the first instruction
        // location will become the address of all preceeding 
        // labels. 
        let label_stack = [];
        let seen_label = 0;

        while (lex.has_next()) {
            // check, if the last instruction was not a label
            if (seen_label == 0) {

                // since, we're only looking at the last instruction,
                // we can assume it is the last entry.
                let index = this.memory.length - 1;

                while (label_stack.length != 0) {
                    let _label = label_stack.pop();
                    console.log("put label=", _label, "at=", index);
                    this.labels[_label] = index; //index == 0 ? 1 : index;
                }
            }

            seen_label = seen_label - 1;
            if (seen_label < 0) {
                seen_label = 0;
            }

            let symbol = lex.next();
            switch (symbol) {
                case 'mov':
                    let target = lex.next();
                    switch (target) {
                        case 'acc':  // mov instruction
                            {
                                let source = lex.next();
                                switch (source) {
                                    case 'bak':
                                        this.memory.push(function (a) {
                                            a.set_acc(a.get_bak());
                                        });
                                        break;
                                    case 'acc':
                                        this.memory.push(function (a) {
                                            a.set_acc(a.get_acc());
                                        })
                                        break;
                                    case 'flg':
                                        this.memory.push(function (a) {
                                            a.set_acc(a.get_flg());
                                        })
                                        break;
                                    default:
                                        let r_number = /[0-9]+/g;
                                        if (!r_number.test(source)) {
                                            throw new Error("Not a number: ", source, "__");
                                        }

                                        this.memory.push(function (a) {
                                            a.set_acc(parseInt(source));
                                        })
                                }
                                break;
                            }
                        case 'flg': // mov instruction
                            {
                                let source = lex.next();
                                switch (source) {
                                    case 'bak':
                                        this.memory.push(function (a) {
                                            a.set_flg(a.get_bak());
                                        });
                                        break;
                                    case 'acc':
                                        this.memory.push(function (a) {
                                            a.set_flg(a.get_acc());
                                        })
                                        break;
                                    case 'flg':
                                        this.memory.push(function (a) {
                                            a.set_flg(a.get_flg());
                                        })
                                        break;
                                    default:

                                        if (r_number.test(source)) {
                                            throw new Error("Not a number");
                                        }

                                        this.memory.push(function (a) {
                                            a.set_flg(parseInt(source));
                                        })
                                }
                                break;
                            }
                        default:
                            throw new Error("Illegal Target Register: '" + target + "'");
                    }
                    break;
                case 'cmp':
                    {
                        let target = lex.next();

                        switch (target) {
                            case 'acc':
                                {
                                    let source = lex.next();
                                    switch (source) {
                                        case 'acc':
                                            this.memory.push(function (a) {
                                                a.set_flg(0);
                                            });
                                            break;
                                        case 'bak':
                                            this.memory.push(function (a) {
                                                if (a.get_acc() > a.get_bak()) {
                                                    this.set_flg(1);
                                                }
                                                else if (a.get_acc() < a.get_bak()) {
                                                    this.set_flg(-1);
                                                }
                                                else {
                                                    this.set_flg(0);
                                                }
                                            });
                                            break;
                                        case 'flg':
                                            this.memory.push(function (a) {
                                                if (a.get_acc() > a.get_flg()) {
                                                    a.set_flg(1);
                                                }
                                                else if (a.get_acc() < a.get_flg()) {
                                                    a.set_flg(-1);
                                                }
                                                else {
                                                    a.set_flg(0);
                                                }
                                            });
                                            break;
                                        default:
                                            let r_number = new RegExp("^[0-9]+$");
                                            if (!r_number.test(source)) {
                                                throw new Error("Not a number");
                                            }

                                            this.memory.push(function (a) {
                                                let number = parseInt(source);

                                                if (a.get_acc() > number) {
                                                    a.set_flg(1);
                                                }
                                                else if (a.get_acc() < number) {
                                                    a.set_flg(-1);
                                                }
                                                else {
                                                    a.set_flg(0);
                                                }

                                            })
                                            break;
                                    }
                                }
                                break;
                            case 'bak':
                                {
                                    let source = lex.next();
                                    switch (source) {
                                        case 'bak':
                                            this.memory.push(function (a) {
                                                a.set_flg(0);
                                            });
                                            break;
                                        case 'acc':
                                            this.memory.push(function (a) {
                                                if (a.get_bak() > a.get_acc()) {
                                                    this.set_flg(1);
                                                }
                                                else if (a.get_bak() < a.get_acc()) {
                                                    this.set_flg(-1);
                                                }
                                                else {
                                                    this.set_flg(0);
                                                }
                                            });
                                            break;
                                        case 'flg':
                                            this.memory.push(function (a) {
                                                if (a.get_bak() > a.get_flg()) {
                                                    a.set_flg(1);
                                                }
                                                else if (a.get_bak() < a.get_flg()) {
                                                    a.set_flg(-1);
                                                }
                                                else {
                                                    a.set_flg(0);
                                                }
                                            });
                                            break;
                                        default:
                                            if (r_number.test(source)) {
                                                throw new Error("Not a number");
                                            }

                                            this.memory.push(function (a) {
                                                let number = parseInt(source);

                                                if (a.get_bak() > number) {
                                                    a.set_flg(1);
                                                }
                                                else if (a.get_bak() < number) {
                                                    a.set_flg(-1);
                                                }
                                                else {
                                                    a.set_flg(0);
                                                }

                                            })
                                            break;
                                    }
                                }
                                break;
                            case 'flg':
                                {
                                    let source = lex.next();
                                    switch (source) {
                                        case 'flg':
                                            this.memory.push(function (a) {
                                                a.set_flg(0);
                                            });
                                            break;
                                        case 'bak':
                                            this.memory.push(function (a) {
                                                if (a.get_flg() > a.get_bak()) {
                                                    this.set_flg(1);
                                                }
                                                else if (a.get_flg() < a.get_bak()) {
                                                    this.set_flg(-1);
                                                }
                                                else {
                                                    this.set_flg(0);
                                                }
                                            });
                                            break;
                                        case 'acc':
                                            this.memory.push(function (a) {
                                                if (a.get_flg() > a.get_flg()) {
                                                    a.set_flg(1);
                                                }
                                                else if (a.get_flg() < a.get_flg()) {
                                                    a.set_flg(-1);
                                                }
                                                else {
                                                    a.set_flg(0);
                                                }
                                            });
                                            break;
                                        default:
                                            if (r_number.test(source)) {
                                                throw new Error("Not a number");
                                            }

                                            this.memory.push(function (a) {
                                                let number = parseInt(source);

                                                if (a.get_flg() > number) {
                                                    a.set_flg(1);
                                                }
                                                else if (a.get_flg() < number) {
                                                    a.set_flg(-1);
                                                }
                                                else {
                                                    a.set_flg(0);
                                                }

                                            })
                                            break;
                                    }
                                }
                                break;
                            default:
                                throw new Error("Illegal Target Register: " + target);
                        }
                    }
                    break;
                case 'jmp':

                    {
                        let label = lex.next();
                        let r_label = /^[a-z]+$/g;
                        if (!r_label.test(label)) {
                            throw new Error("Illegal label defintion: " + label);
                        }
                        this.memory.push(function (a) {
                            let llabel = label;
                            if (a.labels[llabel] == null) {
                                throw new Error("Label not found: " + llabel);
                            }
                            a.set_pc(a.labels[label] - 1);
                        });
                        break;
                    }
                case 'jeq':
                    {
                        let label = lex.next();
                        let r_label = /^[a-z]+$/g;
                        if (!r_label.test(label)) {
                            throw new Error("Illegal label defintion: " + label);
                        }
                        this.memory.push(function (a) {
                            if (a.get_flg() == 0) {
                                a.set_pc(a.labels[label] - 1);
                            }
                        });


                        break;
                    }
                case 'jne':
                    {
                        let label = lex.next();
                        let r_label = /^[a-z]+$/g;
                        if (!r_label.test(label)) {
                            throw new Error("Illegal label defintion: ", label);
                        }

                        this.memory.push(function (a) {
                            if (a.get_flg() != 0) {
                                a.set_pc(a.labels[label] - 1);
                            }
                        });

                        break;
                    }
                case 'jez': // duplicate?
                    {
                        let label = lex.next();
                        let r_label = /^[a-z]+$/g;
                        if (!r_label.test(label)) {
                            throw new Error("Illegal label defintion: ", label);
                        }

                        this.memory.push(function (a) {
                            if (a.get_flg() == 0) {
                                a.set_pc(a.labels[label] - 1);
                            }
                        });

                        break;
                    }
                case 'jgz':
                    {

                        let label = lex.next();
                        let r_label = /^[a-z]+$/g;
                        if (!r_label.test(label)) {
                            throw new Error("Illegal label defintion: ", label);
                        }

                        this.memory.push(function (a) {
                            if (a.get_flg() > 0) {
                                a.set_pc(a.labels[label] - 1);
                            }
                        });

                        break;
                    }
                case 'jlz':
                    {
                        let label = lex.next();
                        let r_label = /^[a-z]+$/g;
                        if (!r_label.test(label)) {
                            throw new Error("Illegal label defintion: ", label);
                        }
                        this.memory.push(function (a) {
                            if (a.get_flg() < 0) {
                                a.set_pc(a.labels[label] - 1);
                            }
                        });

                        break;
                    }
                case 'add':
                    {
                        let next = lex.next();
                        switch (next) {
                            case 'acc':
                                this.memory.push(function (a) {
                                    a.add_acc(a.get_acc());
                                });
                                break;
                            case 'bak':
                                this.memory.push(function (a) {
                                    a.add_acc(a.get_bak());
                                });
                                break;
                            default:
                                let r_number = /^[0-9]+$/g;
                                if (!r_number.test(next)) {
                                    throw new Error("Not a number: ", next);
                                }

                                this.memory.push(function (a) {
                                    let number = parseInt(next);
                                    a.add_acc(number);
                                });
                        }
                        break;
                    }
                case 'sub':
                    {
                        let next = lex.next();
                        switch (next) {
                            case 'acc':
                                this.memory.push(function (a) {
                                    a.sub_acc(a.get_acc());
                                });
                                break;
                            case 'bak':
                                this.memory.push(function (a) {
                                    a.sub_acc(a.get_bak());
                                });
                                break;
                            default:
                                let r_number = new RegExp("^[0-9]+$");
                                if (!r_number.test(next)) {
                                    throw new Error("Not a number: ", next);
                                }
                                this.memory.push(function (a) {

                                    let number = parseInt(next);
                                    a.sub_acc(number);
                                });
                        }
                        break;
                    }
                case 'mul':
                    {
                        let next = lex.next();
                        switch (next) {
                            case 'acc':
                                this.memory.push(function (a) {
                                    a.mul_acc(a.get_acc());
                                });
                                break;
                            case 'bak':
                                this.memory.push(function (a) {
                                    a.mul_acc(a.get_bak());
                                });
                                break;
                            default:
                                let r_number = /^[0-9]+$/g;
                                if (!r_number.test(next)) {
                                    throw new Error("Not a number: ", next);
                                }

                                this.memory.push(function (a) {
                                    let number = parseInt(next);
                                    a.mul_acc(number);
                                });
                        }
                        break;
                    }
                case 'div':
                    {
                        let next = lex.next();
                        switch (next) {
                            case 'acc':
                                this.memory.push(function (a) {
                                    a.div_acc(a.get_acc());
                                });
                                break;
                            case 'bak':
                                this.memory.push(function (a) {
                                    a.div_acc(a.get_bak());
                                });
                                break;
                            default:
                                let r_number = /^[0-9]+$/g;
                                if (!r_number.test(next)) {
                                    throw new Error("Not a number: ", next);
                                }

                                this.memory.push(function (a) {
                                    let number = parseInt(next);
                                    a.div_acc(number);
                                });
                        }
                        break;
                    }
                case 'mod':
                    {
                        let next = lex.next();
                        switch (next) {
                            case 'acc':
                                this.memory.push(function (a) {
                                    a.mod_acc(a.get_acc());
                                });
                                break;
                            case 'bak':
                                this.memory.push(function (a) {
                                    a.mod_acc(a.get_bak());
                                });
                                break;
                            default:
                                if (!r_number.test(next)) {
                                    throw new Error("Not a number: ", next);
                                }

                                this.memory.push(function (a) {
                                    let number = parseInt(next);
                                    a.mod_acc(number);
                                });
                        }
                        break;
                    }
                case 'swp':
                    this.memory.push(function (a) {
                        let acc = a.get_acc();
                        a.set_acc(a.get_bak());
                        a.set_bak(acc);
                    })
                    break;
                case 'push':
                    this.memory.push(function (a) {
                        a.push_stack(a.get_acc());
                    })
                    break;
                case 'pop':
                    this.memory.push(function (a) {
                        a.set_acc(a.pop_stack());
                    })
                    break;
                case 'nop':
                    this.inc_pc();
                    break;

                default:
                    let r_label_def = new RegExp("^[a-z]+\:$");
                    if (!r_label_def.test(symbol)) {
                        throw new Error("Illegal Symbol: " + symbol);
                    }
                    let label = symbol.replace(":", "");
                    label_stack.push(label);
                    seen_label += 1;
            }
        } // end parsing

        // clear labelstack
        // check, if the last instruction was not a label
        if (seen_label == 0) {

            // since, we're only looking at the last instruction,
            // we can assume it is the last entry.
            let index = this.memory.length - 1;

            while (label_stack.length != 0) {
                let _label = label_stack.pop();
                this.labels[_label] = index;
            }
        }

        seen_label -= 1;
        if (seen_label < 0) {
            seen_label = 0;
        }


        // debugger;
    }
} // end cpu def



