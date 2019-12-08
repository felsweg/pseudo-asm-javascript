var init_logic = function () {
    let ta = document.getElementsByTagName("textarea")[0];
    let btn = document.getElementById("adv");
    let line = 0;
    let start = 0;
    let num_lines = 0;

    // display vars
    let l_acc = document.getElementById('label_acc');
    let l_bak = document.getElementById('label_bak');
    let l_tst = document.getElementById('label_tst');

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

    ta.onblur = function () {
        cpu.compile(ta.value);
    }


    let step = function () {
        fill_empty_space(ta);

        let values = ta.value.split("\n");
        num_lines = values.length;

        ta.focus();
        ta.selectionStart = start;
        if (line == 0) {
            ta.selectionEnd = start + values[line].length;
        } else {
            ta.selectionEnd = start + values[line].length + 1;
        }

        // execute step
        start += values[line].length + 1;
        line = line + 1;

        if (line >= (num_lines)) {
            line = 0;
            start = 0;
        }
        //debugger;
        let empty = /^[\s]*$/g;
        if (empty.test(values[line])) {
            // skip this line
            start += values[line].length + 1;
            line = line + 1;
        }

    };

    btn.onclick = step;


    // test automatic playbacl
    // setInterval(step, 200);

};

// fills the empty space with blank spaces
// between instructions  to make the 
// highlighting more pleasant ;)
function fill_empty_space(e) {
    let split = e.value.split("\n");
    let text = "";

    for (i = 0; i < split.length; i++) {
        let line = split[i];
        let fill = clamp(e.cols - line.length);
        line += " ".repeat(fill);
        if (i == split.length - 1) {
            text += line;
        } else {
            text += line + "\n";
        }
    }
    e.value = text;
}

// TODO: is this bogus?
// inverse operation for fill_empty_space
function remove_empty_space(e) {
    let split = e.value.split("\n");
    let text = "";

    for (i = 0; i < split.length; i++) {
        let line = split[i].trim();

        if (i == split.length - 1) {
            text += line;
        } else {
            text += line + "\n";
        }
    }

    e.value = text;
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
        this.acc = v;
    },
    'add_acc': function (v) {
        if (v > 10000 || v < -10000) {
            throw new Error("Value out of range");
        }
        this.acc += v;
    },
    'sub_acc': function (v) {
        if (v > 10000 || v < -10000) {
            throw new Error("Value out of range");
        }
        this.acc -= v;
    },
    'mul_acc': function (v) {
        if (v > 100 || v < -100) {
            throw new Error("Value out of range");
        }
        this.acc *= v;
    },
    'div_acc': function (v) {
        if (v == 0) {
            throw new Error("Can't divide by zero!")
        }

        if (v > 100 || v < -100) {
            throw new Error("Value out of range");
        }

        this.acc /= v;
    },
    'mod_acc': function (v) {
        if (v < 1) {
            throw new Error("Can't divide by zero");
        }

        this.acc %= v;
    },
    'get_acc': function (v) {
        return this.acc;
    },
    'set_bak': function (v) {
        this.bak = v;
    },
    'get_bak': function (v) {
        return this.bak;
    },
    'set_tst': function (v) {
        this.tst = v;
    },
    'get_tst': function () {
        return this.tst;
    },
    'is_tst_zero': function () {
        return this.tst == 0;
    },
    'is_tst_gtz': function () {
        return this.tst > 0;
    },
    'is_tst_ltz': function () {
        return this.tst < 0;
    },
    'set_pc': function (p) {
        this.pc = p;
    },
    'get_pc': function () {
        return this.pc;
    },
    'inc_pc': function () {
        this.pc += 1;
    },
    'dec_pc': function () {
        if (this.pc == 0) {
            return;
        }

        this.pc -= 1;
    },
    'push_stack': function (v) {
        if (this.sp == 0) {
            throw new Error("Stack overflow");
        }
        this.stack[this.sp--] = v;
    },
    'pop_stack': function () {
        if (this.sp == 32) {
            return null;
        }
        return this.stack[this.sp++];
    },

    'registers': {
        'acc': 0,
        'bak': 0,
        'tst': 0,
        'bak': 0,
        'pc': 0,
        'stack': [],
        'sp': 32
    },

    // this function 'compiles' the given code into
    // an array of instructions (functions in this case) modifying
    // the registers of the virtual cpu. 
    // the stream of token gets parsed and transformed into the appropriate function
    // calls. 
    //
    // TODO: implement the parser
    // TODO: match the program counter (pc) with the actual highlighting of code
    //       to make the actual execution more intuitive
    'compile': function (cc) {

        // matchers
        let r_label_def = /^[a-z]+\:$/g;
        let r_label = /^[a-z]+$/g;
        let r_number = /[0-9]+/g;

        // clean up non-tokens
        let code = cc
            .replace(/\n/g, " ")
            .replace(",", " ")
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
                    throw new Error("End Of Stream");
                }
                // debugger;
                return this.stream[this.pos++];
            }
        };

        while (code.length != 0) {
            let symbol = lex.next();


            switch (symbol) {
                case 'mov':
                    let target = lex.next();
                    switch (target) {
                        case 'acc':  // mov instruction
                            let source_acc = lex.next();
                            switch (source_acc) {
                                case 'bak':
                                    this.memory.push(function () {
                                        this.set_acc(this.get_bak());
                                    });
                                    break;
                                case 'acc':
                                    this.memory.push(function () {
                                        this.set_acc(this.get_acc());
                                    })
                                    break;
                                case 'tst':
                                    this.memory.push(function () {
                                        this.set_acc(this.get_tst());
                                    })
                                    break;
                                default:
                                    let r_number = /[0-9]+/g;
                                    if (!r_number.test(source_acc)) {
                                        throw new Error("Not a number: ", source_acc);
                                    }

                                    this.memory.push(function () {
                                        this.set_acc(parseInt(source_acc));
                                    })
                            }
                            break;
                        case 'tst': // mov instruction

                            let source_tst = lex.next();
                            switch (source_tst) {
                                case 'bak':
                                    this.memory.push(function () {
                                        this.set_tst(this.get_bak());
                                    });
                                    break;
                                case 'acc':
                                    this.memory.push(function () {
                                        this.set_tst(this.get_acc());
                                    })
                                    break;
                                case 'tst':
                                    this.memory.push(function () {
                                        this.set_tst(this.get_tst());
                                    })
                                    break;
                                default:

                                    if (r_number.test(source_tst)) {
                                        throw new Error("Not a number");
                                    }

                                    this.memory.push(function () {
                                        this.set_tst(parseInt(source_tst));
                                    })
                            }

                            break;
                        default:
                            throw new Error("Illegal Target Register: ", target);
                    }
                    break;
                case 'jmp':

                    {
                        let label = lex.next();
                        if (!r_label.test(label)) {
                            throw new Error("Illegal label defintion: ", label);
                        }
                        this.memory.push(function () {
                            // can this break ?
                            if (this.labels[label] == null) {
                                throw new Error("Label not found: ", label);
                            }
                            this.pc = this.labels[label];
                        });
                        break;
                    }
                case 'jeq':
                    {
                        let label = lex.next();
                        if (!r_label.test(label)) {
                            throw new Error("Illegal label defintion: ", label);
                        }

                        if (this.get_tst() == 0) {
                            this.pc = this.labels[label];
                        }

                        break;
                    }
                case 'jne':
                    {
                        let label = lex.next();
                        if (!r_label.test(label)) {
                            throw new Error("Illegal label defintion: ", label);
                        }

                        if (this.get_tst() != 0) {
                            this.pc = this.labels[label];
                        }

                        break;
                    }
                case 'jez': // duplicate?
                    {
                        let label = lex.next();
                        if (!r_label.test(label)) {
                            throw new Error("Illegal label defintion: ", label);
                        }

                        if (this.get_tst() == 0) {
                            this.pc = this.labels[label];
                        }
                        break;
                    }
                case 'jgz':
                    {
                        let label = lex.next();
                        if (!r_label.test(label)) {
                            throw new Error("Illegal label defintion: ", label);
                        }

                        if (this.get_tst() > 0) {
                            this.pc = this.labels[label];
                        }
                        break;
                    }
                case 'jlz':
                    {
                        let label = lex.next();
                        if (!r_label.test(label)) {
                            throw new Error("Illegal label defintion: ", label);
                        }

                        if (this.get_tst() < 0) {
                            this.pc = this.labels[label];
                        }
                        break;
                    }
                case 'add':
                    {
                        let next = lex.next();
                        switch (next) {
                            case 'acc':
                                this.memory.push(function () {
                                    this.add_acc(this.get_acc());
                                });
                                break;
                            case 'bak':
                                this.memory.push(function () {
                                    this.add_acc(this.get_bak());
                                });
                                break;
                            default:
                                if (!r_number.test(next)) {
                                    throw new Error("Not a number: ", next);
                                }

                                this.memory.push(function () {
                                    let number = parseInt(next);
                                    this.add_acc(number);
                                });
                        }
                        break;
                    }
                case 'sub':
                    {
                        let next = lex.next();
                        switch (next) {
                            case 'acc':
                                this.memory.push(function () {
                                    this.sub_acc(this.get_acc());
                                });
                                break;
                            case 'bak':
                                this.memory.push(function () {
                                    this.sub_acc(this.get_bak());
                                });
                                break;
                            default:
                                if (!r_number.test(next)) {
                                    throw new Error("Not a number: ", next);
                                }

                                this.memory.push(function () {
                                    let number = parseInt(next);
                                    this.sub_acc(number);
                                });
                        }
                        break;
                    }
                case 'mul':
                    {
                        let next = lex.next();
                        switch (next) {
                            case 'acc':
                                this.memory.push(function () {
                                    this.mul_acc(this.get_acc());
                                });
                                break;
                            case 'bak':
                                this.memory.push(function () {
                                    this.mul_acc(this.get_bak());
                                });
                                break;
                            default:
                                if (!r_number.test(next)) {
                                    throw new Error("Not a number: ", next);
                                }

                                this.memory.push(function () {
                                    let number = parseInt(next);
                                    this.mul_acc(number);
                                });
                        }
                        break;
                    }
                case 'div':
                    {
                        let next = lex.next();
                        switch (next) {
                            case 'acc':
                                this.memory.push(function () {
                                    this.div_acc(this.get_acc());
                                });
                                break;
                            case 'bak':
                                this.memory.push(function () {
                                    this.div_acc(this.get_bak());
                                });
                                break;
                            default:
                                if (!r_number.test(next)) {
                                    throw new Error("Not a number: ", next);
                                }

                                this.memory.push(function () {
                                    let number = parseInt(next);
                                    this.div_acc(number);
                                });
                        }
                        break;
                    }
                case 'mod':
                    {
                        let next = lex.next();
                        switch (next) {
                            case 'acc':
                                this.memory.push(function () {
                                    this.mod_acc(this.get_acc());
                                });
                                break;
                            case 'bak':
                                this.memory.push(function () {
                                    this.mod_acc(this.get_bak());
                                });
                                break;
                            default:
                                if (!r_number.test(next)) {
                                    throw new Error("Not a number: ", next);
                                }

                                this.memory.push(function () {
                                    let number = parseInt(next);
                                    this.mod_acc(number);
                                });
                        }
                        break;
                    }
                case 'swp':
                    this.memory.push(function () {
                        let acc = this.get_acc();
                        this.set_acc(this.get_bak);
                        this.set_bak(acc);
                    })
                    break;
                case 'psh':
                    this.memory.push(function () {
                        this.push_stack(this.get_acc());
                    })
                    break;
                case 'pop':
                    this.memory.push(function () {
                        this.set_acc(this.pop_stack());
                    })
                    break;
                case 'nop':
                    this.inc_pc();
                    break;

                default:
                    // handle labels
                    if (!r_label_def.test(symbol)) {
                        throw new Error("Illegal Symbol: ", symbol, "here");
                    }

                    let label = symbol.replace(":", "");
                    this.labels[label] = this.pc; // TODO is this correct?

            }
        } // end parsing
    }
}

// ISA
//
// jmp      <label> ; unconditional jump
// jeq      <label> ; jump, if FLG register == 0
// jne      <label> ; jump, if FLG register != 0
// jez      <label> ; jump, if FLG register == 0 (?)
// jgz      <label> ; jump, if FLG register > 0
// jlz      <label> ; jump, if FLG register < 0
// add      Register / Num 
// sub      Register / Num
// div      Register / Num
// mul      Register / Num
// mod      Register / Num
// mov      Register, Register / Num
// swp      <none>          ; swaps acc and bak
// psh      <none>          ; push a value to the stack
// pop      <none>          ; pops a value from the stack
// nop                      ; no operation

// possible extensions
// shl      Register / Num
// shr      Register / Num
// swp      Register / Num
// xor      Register / Num
// orr      Register / Num
// and      Register / Num

// Registers
//
// ACC          
// BAK
// FLG
// (LFT)
// (RGH)
// (TOP)
// (BOT)
// (LST)
// (ANY)
// (ZER)
