import { Router } from "express";
import { QueryTypes } from "sequelize";

import { parseSearchQuery } from "@web-speed-hackathon-2026/server/src/utils/parse_search_query.js";
import { sequelize } from "../../sequelize";

export const searchRouter = Router();

type QueryRet = {
  id: string;
  text: string;
  created_at: Date;
  updated_at: Date;
  user_id: string;
  user_name: string;
  user_username: string;
  user_description: string;
  upi_id: string;
  upi_alt: string;
  image_id: string | null;
  image_alt: string | null;
  sound_id: string | null;
  movie_id: string | null;
};

searchRouter.get("/search", async (req, res) => {
  const query = req.query["q"];

  if (typeof query !== "string" || query.trim() === "") {
    return res.status(200).type("application/json").send([]);
  }

  const { keywords, sinceDate, untilDate } = parseSearchQuery(query);

  // キーワードも日付フィルターもない場合は空配列を返す
  if (!keywords && !sinceDate && !untilDate) {
    return res.status(200).type("application/json").send([]);
  }

  const searchTerm = keywords ? `%${keywords}%` : null;
  const limit =
    req.query["limit"] != null ? Number(req.query["limit"]) : undefined;
  const offset =
    req.query["offset"] != null ? Number(req.query["offset"]) : undefined;

  const dateReplacements = {
    since:
      sinceDate == null
        ? "1980-01-01T00:00:00.000Z"
        : `${sinceDate.toISOString().slice(0, 10)}T00:00:00.000Z`,
    until:
      untilDate == null
        ? "2030-12-31T23:59:59.999Z"
        : `${untilDate.toISOString().slice(0, 10)}T23:59:59.999Z`,
  };

  const rows = searchTerm
    ? await sequelize!.query<QueryRet>(
        `
        select
            Posts.id as id,
            Posts.text as text,
            Posts.createdAt as created_at,
            Posts.updatedAt as updated_at,
            Users.id as user_id,
            Users.name as user_name,
            Users.username as user_username,
            Users.description as user_description,
            ProfileImages.id as upi_id,
            ProfileImages.alt as upi_alt,
            Images.id as image_id,
            Images.alt as image_alt,
            Sounds.id as sound_id,
            Movies.id as movie_id
        from Posts
        inner join Users on Posts.userId = Users.id
        inner join ProfileImages on Users.profileImageId = ProfileImages.id
        left join PostsImagesRelations on Posts.id = PostsImagesRelations.postId
        inner join Images on PostsImagesRelations.imageId = Images.id
        left join Movies on Movies.id = Posts.movieId
        left join Sounds on Sounds.id = Posts.soundId
        where
            Posts.createdAt BETWEEN :since AND :until
            AND (
                Posts.text like :search
                OR Users.name like :search
                OR Users.username like :search
            )
        order by Posts.createdAt DESC
        LIMIT :limit
        OFFSET :offset;
    `,
        {
          replacements: {
            search: searchTerm,
            limit,
            offset,
            ...dateReplacements,
          },
          type: QueryTypes.SELECT,
        },
      )
    : await sequelize!.query<QueryRet>(
        `
          select
              Posts.id as id,
              Posts.text as text,
              Posts.createdAt as created_at,
              Posts.updatedAt as updated_at,
              Users.id as user_id,
              Users.name as user_name,
              Users.username as user_username,
              Users.description as user_description,
              ProfileImages.id as upi_id,
              ProfileImages.alt as upi_alt,
              Images.id as image_id,
              Images.alt as image_alt,
              Sounds.id as sound_id,
              Movies.id as movie_id
          from Posts
          inner join Users on Posts.userId = Users.id
          inner join ProfileImages on Users.profileImageId = ProfileImages.id
          left join PostsImagesRelations on Posts.id = PostsImagesRelations.postId
          inner join Images on PostsImagesRelations.imageId = Images.id
          left join Movies on Movies.id = Posts.movieId
          left join Sounds on Sounds.id = Posts.soundId
          where
              Posts.createdAt BETWEEN :since AND :until
          order by Posts.createdAt DESC
          LIMIT :limit
          OFFSET :offset;
      `,
        {
          replacements: {
            limit,
            offset,
            ...dateReplacements,
          },
          type: QueryTypes.SELECT,
        },
      );

  const result = Object.entries(Object.groupBy(rows, (item) => item.id)).map(
    ([postId, items]) => {
      const representative = items?.[0];
      if (items == null || representative == null) {
        return null;
      }
      return {
        id: postId,
        text: representative.text,
        createdAt: representative.created_at,
        updatedAt: representative.updated_at,
        user: {
          id: representative.user_id,
          name: representative.user_name,
          username: representative.user_username,
          description: representative.user_description,
          profileImage: {
            id: representative.upi_id,
            alt: representative.upi_alt,
          },
        },
        images: items
          .filter((item) => item.image_id !== null)
          .map((item) => ({
            id: item.image_id!,
            alt: item.image_alt ?? "",
          })),
        movie:
          representative.movie_id == null
            ? null
            : {
                id: representative.movie_id,
              },
        sound:
          representative.sound_id == null
            ? null
            : {
                id: representative.sound_id,
              },
      };
    },
  );

  return res.status(200).type("application/json").send(result);
});

searchRouter.get("/search-total", async (req, res) => {
  const query = req.query["q"];

  if (typeof query !== "string" || query.trim() === "") {
    return res.status(200).type("application/json").send({ total: 0 });
  }

  const { keywords, sinceDate, untilDate } = parseSearchQuery(query);

  console.log(req.query, { keywords, sinceDate, untilDate });

  // キーワードも日付フィルターもない場合は空配列を返す
  if (!keywords && !sinceDate && !untilDate) {
    return res.status(200).type("application/json").send([]);
  }

  const searchTerm = keywords ? `%${keywords}%` : null;

  const dateReplacements = {
    since:
      sinceDate == null
        ? "1980-01-01T00:00:00.000Z"
        : `${sinceDate.toISOString().slice(0, 10)}T00:00:00.000Z`,
    until:
      untilDate == null
        ? "2030-12-31T23:59:59.999Z"
        : `${untilDate.toISOString().slice(0, 10)}T23:59:59.999Z`,
  };

  const total = searchTerm
    ? await sequelize!.query<{ count: number }>(
        `
          select
              COUNT(*) as count
          from Posts
          inner join Users on Posts.userId = Users.id
          where
              Posts.createdAt BETWEEN :since AND :until
              AND (
                  Posts.text like :search
                  OR Users.name like :search
                  OR Users.username like :search
              );
        `,
        {
          replacements: {
            search: searchTerm,
            ...dateReplacements,
          },
          type: QueryTypes.SELECT,
        },
      )
    : await sequelize!.query<{ count: number }>(
        `
      select
          COUNT(*) as count
      from Posts
      where Posts.createdAt BETWEEN :since AND :until;
    `,
        {
          replacements: {
            ...dateReplacements,
          },
          type: QueryTypes.SELECT,
        },
      );

  return res
    .status(200)
    .type("application/json")
    .send({ total: total[0]?.count ?? 0 });
});
