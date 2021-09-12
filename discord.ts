import axios from 'axios';

export class ChannelBot {
  constructor(private webhook: string) {}

  async sendMessage(embeds: any[]) {
    try {
      await axios.post(this.webhook, {
        embeds,
      });
    } catch (error) {
      console.log(error);
    }
  }
}
