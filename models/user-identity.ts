import * as TypeORM from "typeorm";
import Model from "./common";
import User from "./user";

enum UserRole {
  teacher = "teacher",
  student = "student",
  other = "other"
}

enum ReviewStatus {
  pending = "pending",
  approved = "approved",
  rejected = "rejected"
}

@TypeORM.Entity()
export default class UserIdentity extends Model {
  static cache = false;
  
  @TypeORM.PrimaryColumn({ type: "integer" })
  user_id: number;

  @TypeORM.Column({ type: "enum", enum: UserRole })
  role: UserRole;

  @TypeORM.Column({ type: "varchar", length: 20 })
  real_name: string;

  @TypeORM.Column({ nullable: true, type: "integer" })
  graduation_year: number;

  @TypeORM.Column({ nullable: true, type: "integer" })
  oierdb_id: number;

  @TypeORM.Index()
  @TypeORM.Column({ type: "enum", enum: ReviewStatus, default: ReviewStatus.pending })
  status: ReviewStatus;

  @TypeORM.Column({ type: "datetime" })
  creation_time: Date;

  @TypeORM.Column({ type: "datetime" })
  update_time: Date;

  @TypeORM.Column({ nullable: true, type: "datetime" })
  review_time: Date;
}
