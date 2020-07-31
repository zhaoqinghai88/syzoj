import * as TypeORM from "typeorm";
import Model from "./common";

import User from "./user";
import Problem from "./problem";
import ArticleComment from "./article-comment";
import ArticleUserView from "./article-user-view";

declare var syzoj: any;

enum ForumName {
  global = "global",
  announcements = "announcements",
  problems = "problems",
  solutions = "solutions"
}

@TypeORM.Entity()
export default class Article extends Model {
  static cache = false;

  @TypeORM.PrimaryGeneratedColumn()
  id: number;

  @TypeORM.Column({ nullable: true, type: "varchar", length: 80 })
  title: string;

  @TypeORM.Column({ nullable: true, type: "mediumtext" })
  content: string;

  @TypeORM.Index()
  @TypeORM.Column({ nullable: true, type: "integer" })
  user_id: number;

  @TypeORM.Index()
  @TypeORM.Column({ nullable: true, type: "enum", enum: ForumName })
  forum: ForumName;

  @TypeORM.Index()
  @TypeORM.Column({ nullable: true, type: "integer" })
  problem_id: number;

  @TypeORM.Column({ nullable: true, type: "integer" })
  public_time: number;

  @TypeORM.Column({ nullable: true, type: "integer" })
  update_time: number;

  @TypeORM.Index()
  @TypeORM.Column({ nullable: true, type: "integer" })
  sort_time: number;

  @TypeORM.Column({ default: 0, type: "integer" })
  comments_num: number;

  @TypeORM.Column({ default: 0, type: "integer" })
  views: number;

  @TypeORM.Column({ default: true, type: "boolean" })
  allow_comment: boolean;

  @TypeORM.Index()
  @TypeORM.Column({ nullable: true, type: "boolean" })
  is_notice: boolean;

  user?: User;
  problem?: Problem;

  async loadRelationships() {
    this.user = await User.findById(this.user_id);
  }

  async isAllowedEditBy(user) {
    return user && (user.is_admin || this.user_id === user.id);
  }

  async isAllowedCommentBy(user) {
    return user && (this.allow_comment || user.is_admin || this.user_id === user.id);
  }

  async resetReplyCountAndTime() {
    await syzoj.utils.lock(['Article::resetReplyCountAndTime', this.id], async () => {
      this.comments_num = await ArticleComment.count({ article_id: this.id });
      if (this.comments_num === 0) {
        this.sort_time = this.public_time;
      } else {
        this.sort_time = (await ArticleComment.findOne({
          where: { article_id: this.id },
          order: { public_time: "DESC" }
        })).public_time;
      }
      await this.save();
    });
  }

  async updateViews(user: User) {
    if (!user) return;
    const data = {
      article_id: this.id,
      user_id: user.id
    };
    let userView = await ArticleUserView.findOne(data);
    if (!userView) {
      userView = await ArticleUserView.create(data);
      await userView.save();
      this.views += 1;
      await this.save();
      return true;
    } else {
      return false;
    }
  }

  async delete() {
    await Promise.all((await ArticleComment.find({
      article_id: this.id
    })).map(comment => comment.destroy()));
    await ArticleUserView.delete({
      article_id: this.id
    });
    await this.destroy();
  }
};
