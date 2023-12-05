class User {
  api = "https://daily-report-c57008788d26.herokuapp.com";
  name;
  email;
  code;

  constructor() {
    this.myHeaders = new Headers();
    this.myHeaders.append("Content-Type", "application/json");
  }

  createUser() {
    if (this.name && this.email) {
      const raw = JSON.stringify({
        username: this.name,
        email: this.email,
      });

      const requestOptions = {
        method: "POST",
        headers: this.myHeaders,
        body: raw,
        redirect: "follow",
      };

      return fetch(`${this.api}/user/create`, requestOptions);
    }
  }

  activateAccount() {
    if (this.email && this.code) {
      const raw = JSON.stringify({
        code: this.code,
        email: this.email,
      });

      const requestOptions = {
        method: "POST",
        headers: this.myHeaders,
        body: raw,
        redirect: "follow",
      };

      return fetch(`${this.api}/user/activate`, requestOptions);
    }
  }

  setClickUpToken(token) {
    if (this.email && this.code) {
      const raw = JSON.stringify({
        encode: this.code,
        email: this.email,
        token: token,
      });

      const requestOptions = {
        method: "POST",
        headers: this.myHeaders,
        body: raw,
        redirect: "follow",
      };

      return fetch(`${this.api}/user/set/clickup`, requestOptions);
    }
  }

  setName(name) {
    if (name) {
      this.name = name;
    }
  }

  setEmail(email) {
    if (email) {
      this.email = email;
    }
  }

  setCode(code) {
    if (code) {
      this.code = code;
    }
  }

  clear() {
    this.name = "";
    this.email = "";
    this.code = "";
  }
}

class Console extends HTMLElement {
  helpText = `Avaliable commands:
   1. echo - print text
   2. clear - clear console
   3. help - show help
   4. start - start registration`;

  constructor() {
    super();
    this.output = this.querySelector(".console-output");
    this.input = this.querySelector(".console-textarea");
    this.preSymbol = this.querySelector(".pre-symbol");
    this.stage = "default";
    this.user = new User();

    this.input.focus();
    this.initListener();
  }

  initListener() {
    document.addEventListener("keypress", async (e) => {
      if (e.key === "Enter") {
        e.preventDefault();

        const value = this.input.value;

        if (!value) {
          return;
        }

        switch (this.stage) {
          case "default":
            const [command, ...content] = value.split(" ");
            try {
              this.commands[command](content.join(" "));
            } catch (e) {
              this.printText(
                `${command} is unavailable. Type 'help' to show commands`
              );
            }
            break;
          case "setname":
            this.user.setName(value);
            this.printText(`Username: ${this.user.name}`);
            this.preSymbol.innerText = `>>> email:`;
            this.stage = "setemail";
            break;
          case "setemail":
            this.user.setEmail(value);
            this.printText(`Email: ${this.user.email}`);
            const responce = await this.user
              .createUser()
              .then((res) => res.json());
            if (responce.error) {
              this.printText(`Something went wrong! Try again!`);
              this.setStageDefault();
              break;
            }
            this.printText(
              `An email with a code has been sent to your email - ${this.user.email}!`
            );
            this.preSymbol.innerText = `>>> code:`;
            this.stage = "setcode";

            break;
          case "setcode":
            this.user.setCode(value);
            const responceActivation = await this.user
              .activateAccount()
              .then((res) => res.json());
            if (responceActivation.active) {
              this.printText("Account activated");
              this.preSymbol.innerText = `>>> ClickUp token:`;
              this.stage = "setclickup";
            } else {
              this.printText(`Something went wrong! Try again!`);
              this.setStageDefault();
            }
            break;
          case "setclickup":
            const tokenResponce = await this.user
              .setClickUpToken(value)
              .then((res) => res.json());
            if (tokenResponce.url) {
              window.location.href = tokenResponce.url;
            } else {
              this.printText(`Something went wrong! Try again!`);
              this.setStageDefault();
            }
            break;
          default:
            this.printText(`Something went wrong! Try again!`);
            this.setStageDefault();
            break;
        }

        this.input.value = "";
      }
    });
  }

  printText(text) {
    const newItem = document.createElement("p");
    newItem.innerText = ">>> " + text;
    this.output.appendChild(newItem);
  }

  clearOutput() {
    this.output.innerHTML = "";
  }

  help() {
    this.printText(this.helpText);
  }

  setStageDefault() {
    this.preSymbol.innerText = `>>>`;
    this.stage = "default";
  }

  setStageName() {
    this.preSymbol.innerText = `>>> username:`;
    this.stage = "setname";
  }

  commands = {
    clear: this.clearOutput.bind(this),
    echo: this.printText.bind(this),
    help: this.help.bind(this),
    start: this.setStageName.bind(this),
  };
}

customElements.define("voo-console", Console);
